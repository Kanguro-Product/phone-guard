import { createClient } from "@/lib/supabase/server"

export interface RotationContext {
  phoneNumberId: string
  userId: string
  rotationType: 'spam_rotation' | 'scheduled_rotation' | 'manual_rotation'
  priority: number
  reason?: string
  detectedBy?: 'api' | 'user' | 'automatic'
  context?: any
}

export interface RotationResult {
  success: boolean
  newNumber?: string
  error?: string
  rotationId?: string
}

export class RotationService {
  private supabase: any

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Add a phone number to the rotation queue
   */
  async addToRotationQueue(context: RotationContext): Promise<RotationResult> {
    try {
      const { data, error } = await this.supabase
        .from('rotation_queue')
        .insert({
          phone_number_id: context.phoneNumberId,
          user_id: context.userId,
          rotation_type: context.rotationType,
          priority: context.priority,
          context: {
            reason: context.reason,
            detected_by: context.detectedBy,
            ...context.context
          }
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding to rotation queue:', error)
        return { success: false, error: error.message }
      }

      return { success: true, rotationId: data.id }
    } catch (error) {
      console.error('Error in addToRotationQueue:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  /**
   * Process rotation queue items
   */
  async processRotationQueue(): Promise<void> {
    try {
      // Get pending rotation items ordered by priority and scheduled time
      const { data: queueItems, error } = await this.supabase
        .from('rotation_queue')
        .select(`
          *,
          phone_numbers (
            id,
            number,
            user_id,
            status,
            provider
          )
        `)
        .in('status', ['pending', 'in_progress'])
        .order('priority', { ascending: true })
        .order('scheduled_at', { ascending: true })
        .limit(10)

      if (error) {
        console.error('Error fetching rotation queue:', error)
        return
      }

      for (const item of queueItems || []) {
        await this.processRotationItem(item)
      }
    } catch (error) {
      console.error('Error processing rotation queue:', error)
    }
  }

  /**
   * Process a single rotation item
   */
  private async processRotationItem(item: any): Promise<void> {
    try {
      // Mark as in progress
      await this.supabase
        .from('rotation_queue')
        .update({ 
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', item.id)

      // Get available numbers for the user
      const { data: availableNumbers, error: numbersError } = await this.supabase
        .from('phone_numbers')
        .select('id, number, status')
        .eq('user_id', item.user_id)
        .in('status', ['active', 'inactive'])
        .neq('id', item.phone_number_id)
        .order('created_at', { ascending: true })

      if (numbersError) {
        throw new Error(`Error fetching available numbers: ${numbersError.message}`)
      }

      if (!availableNumbers || availableNumbers.length === 0) {
        throw new Error('No hay números disponibles para rotación')
      }

      // Select the best available number
      const selectedNumber = this.selectBestNumber(availableNumbers)
      
      if (!selectedNumber) {
        throw new Error('No se pudo seleccionar un número para rotación')
      }

      // Update the original number to inactive
      await this.supabase
        .from('phone_numbers')
        .update({ 
          status: 'inactive',
          rotation_completed_at: new Date().toISOString()
        })
        .eq('id', item.phone_number_id)

      // Update the selected number to active
      await this.supabase
        .from('phone_numbers')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedNumber.id)

      // Mark rotation as completed
      await this.supabase
        .from('rotation_queue')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', item.id)

      // Create rotation completed event
      await this.supabase
        .from('spam_events')
        .insert({
          phone_number_id: item.phone_number_id,
          user_id: item.user_id,
          event_type: 'rotation_completed',
          reason: `Número rotado a ${selectedNumber.number}`,
          detected_by: 'automatic',
          context: {
            new_number: selectedNumber.number,
            rotation_type: item.rotation_type,
            rotation_id: item.id
          }
        })

      console.log(`Rotation completed: ${item.phone_number_id} -> ${selectedNumber.number}`)
    } catch (error) {
      console.error(`Error processing rotation item ${item.id}:`, error)
      
      // Mark as failed
      await this.supabase
        .from('rotation_queue')
        .update({ 
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', item.id)
    }
  }

  /**
   * Select the best available number for rotation
   */
  private selectBestNumber(numbers: any[]): any {
    // Priority order:
    // 1. Active numbers with good reputation
    // 2. Inactive numbers
    // 3. Numbers with recent activity
    
    const activeNumbers = numbers.filter(n => n.status === 'active')
    const inactiveNumbers = numbers.filter(n => n.status === 'inactive')
    
    // Prefer active numbers first
    if (activeNumbers.length > 0) {
      return activeNumbers[0]
    }
    
    // Then inactive numbers
    if (inactiveNumbers.length > 0) {
      return inactiveNumbers[0]
    }
    
    // Fallback to first available
    return numbers[0]
  }

  /**
   * Get rotation queue status for a user
   */
  async getRotationQueueStatus(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('rotation_queue')
        .select(`
          *,
          phone_numbers (
            id,
            number,
            status
          )
        `)
        .eq('user_id', userId)
        .order('scheduled_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching rotation queue status:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getRotationQueueStatus:', error)
      return []
    }
  }

  /**
   * Cancel a rotation item
   */
  async cancelRotation(rotationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('rotation_queue')
        .update({ status: 'cancelled' })
        .eq('id', rotationId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error cancelling rotation:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in cancelRotation:', error)
      return false
    }
  }

  /**
   * Get spam events for a phone number
   */
  async getSpamEvents(phoneNumberId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('spam_events')
        .select('*')
        .eq('phone_number_id', phoneNumberId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching spam events:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getSpamEvents:', error)
      return []
    }
  }
}
