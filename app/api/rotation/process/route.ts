import { type NextRequest, NextResponse } from "next/server"
import { RotationService } from "@/lib/rotation-service"

export async function POST(request: NextRequest) {
  try {
    // This endpoint should be called by a cron job or background service
    // For now, we'll process the queue when called
    
    const rotationService = new RotationService()
    await rotationService.processRotationQueue()
    
    return NextResponse.json({ 
      success: true, 
      message: "Rotation queue processed" 
    })
  } catch (error) {
    console.error("Error processing rotation queue:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    const rotationService = new RotationService()
    const queueStatus = await rotationService.getRotationQueueStatus(userId)
    
    return NextResponse.json({ queueStatus })
  } catch (error) {
    console.error("Error fetching rotation queue status:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
