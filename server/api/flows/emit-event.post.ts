import { inngest } from '../../utils/inngest'

/**
 * POST /api/flows/emit-event
 *
 * Emits an event to Inngest to trigger matching flows.
 * Called by the frontend when leads or contacts are created.
 *
 * Body:
 *   { event: 'lead/created' | 'contact/added', data: Record<string, any> }
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.event) {
    throw createError({ statusCode: 400, message: 'Event name required' })
  }

  const allowedEvents = ['lead/created', 'contact/added']
  if (!allowedEvents.includes(body.event)) {
    throw createError({ statusCode: 400, message: `Invalid event. Allowed: ${allowedEvents.join(', ')}` })
  }

  try {
    await inngest.send({
      name: body.event,
      data: body.data || {},
    })

    return { success: true, event: body.event }
  } catch (err: any) {
    // Don't fail silently — log but also don't break the calling feature
    console.error('Failed to emit Inngest event:', err.message)
    return { success: false, error: err.message }
  }
})
