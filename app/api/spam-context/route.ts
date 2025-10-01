import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { RotationService } from "@/lib/rotation-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const phoneNumberId = searchParams.get('phoneNumberId')

    if (!phoneNumberId) {
      return NextResponse.json({ error: "Phone number ID is required" }, { status: 400 })
    }

    const rotationService = new RotationService()
    
    // Get spam events
    const spamEvents = await rotationService.getSpamEvents(phoneNumberId)
    
    // Get rotation queue status
    const rotationQueue = await rotationService.getRotationQueueStatus(user.id)
    const relevantRotations = rotationQueue.filter(item => 
      item.phone_numbers?.id === phoneNumberId
    )

    return NextResponse.json({
      spamEvents,
      rotationQueue: relevantRotations
    })
  } catch (error) {
    console.error("Error in spam context API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, phoneNumberId, reason, context } = body

    const rotationService = new RotationService()

    switch (action) {
      case 'mark_spam':
        // Mark number as spam
        const { error: spamError } = await supabase
          .from('phone_numbers')
          .update({
            status: 'spam',
            spam_reason: reason,
            spam_detected_by: 'user',
            spam_detected_at: new Date().toISOString(),
            spam_context: context
          })
          .eq('id', phoneNumberId)
          .eq('user_id', user.id)

        if (spamError) {
          return NextResponse.json({ error: "Failed to mark as spam" }, { status: 500 })
        }

        // Add to rotation queue if immediate protocol
        const rotationResult = await rotationService.addToRotationQueue({
          phoneNumberId,
          userId: user.id,
          rotationType: 'spam_rotation',
          priority: 1,
          reason,
          detectedBy: 'user',
          context
        })

        return NextResponse.json({ 
          success: true, 
          rotationQueued: rotationResult.success 
        })

      case 'resolve_spam':
        // Resolve spam status
        const { error: resolveError } = await supabase
          .from('phone_numbers')
          .update({
            status: 'active',
            spam_resolved_at: new Date().toISOString(),
            spam_resolution_reason: reason
          })
          .eq('id', phoneNumberId)
          .eq('user_id', user.id)

        if (resolveError) {
          return NextResponse.json({ error: "Failed to resolve spam" }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      case 'start_rotation':
        // Start manual rotation
        const manualRotationResult = await rotationService.addToRotationQueue({
          phoneNumberId,
          userId: user.id,
          rotationType: 'manual_rotation',
          priority: 1,
          reason: reason || 'Manual rotation request',
          detectedBy: 'user',
          context
        })

        if (!manualRotationResult.success) {
          return NextResponse.json({ error: manualRotationResult.error }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          rotationId: manualRotationResult.rotationId 
        })

      case 'cancel_rotation':
        const { rotationId } = body
        if (!rotationId) {
          return NextResponse.json({ error: "Rotation ID is required" }, { status: 400 })
        }

        const cancelled = await rotationService.cancelRotation(rotationId, user.id)
        if (!cancelled) {
          return NextResponse.json({ error: "Failed to cancel rotation" }, { status: 500 })
        }

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in spam context API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
