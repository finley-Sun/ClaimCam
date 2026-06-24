// Real splat assets served from Vercel Blob / public root.
export const SPLAT_LIVING_ROOM = "/CozyLivingRoomEntertainment_Setup.spz";
export const SPLAT_FIRE_DAMAGE = "/FireDamagedApartment_Interior.spz";

export function resolveSplatUrl(
  _roomId: string,
  logType: "capture" | "damage",
): string {
  return logType === "damage" ? SPLAT_FIRE_DAMAGE : SPLAT_LIVING_ROOM;
}
