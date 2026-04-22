import ical from "node-ical"
import { addDays, parseISO, format } from "date-fns"

export interface BlockedRange {
  start_date: string
  end_date: string
  external_uid: string
  source: string
}

export async function fetchBlockedDates(
  icalUrl: string,
  source: string
): Promise<BlockedRange[]> {
  const events = await ical.async.fromURL(icalUrl)
  const blocked: BlockedRange[] = []

  for (const event of Object.values(events)) {
    if (!event || event.type !== "VEVENT") continue
    if (!("start" in event) || !("end" in event)) continue
    if (!event.start || !event.end) continue

    const start = event.start instanceof Date ? event.start : new Date(event.start as string)
    const end = event.end instanceof Date ? event.end : new Date(event.end as string)

    // Airbnb/Booking use DTEND as exclusive checkout date
    // so end - 1 day is the last blocked night
    const adjustedEnd = addDays(end, -1)

    blocked.push({
      start_date: format(start, "yyyy-MM-dd"),
      end_date: format(adjustedEnd, "yyyy-MM-dd"),
      external_uid: ("uid" in event && event.uid ? String(event.uid) : `${source}-${start.getTime()}`),
      source,
    })
  }

  return blocked
}
