/** All Singapore MRT station names, grouped by line. */

export const DowntownLine = [
  "Bukit Panjang", "Cashew", "Hillview", "Hume", "Beauty World",
  "King Albert Park", "Sixth Avenue", "Tan Kah Kee", "Botanic Gardens",
  "Stevens", "Newton", "Little India", "Rochor", "Bugis", "Promenade",
  "Bayfront", "Downtown", "Telok Ayer", "Chinatown", "Fort Canning",
  "Bencoolen", "Jalan Besar", "Bendemeer", "Geylang Bahru", "Mattar",
  "MacPherson", "Ubi", "Kaki Bukit", "Bedok North", "Bedok Reservoir",
  "Tampines West", "Tampines", "Tampines East", "Upper Changi", "Expo",
  "Xilin", "Sungei Bedok",
];

export const EastWestLine = [
  "Tuas Link", "Tuas West Road", "Tuas Crescent", "Gul Circle", "Joo Koon",
  "Pioneer", "Boon Lay", "Lakeside", "Chinese Garden", "Jurong East",
  "Clementi", "Dover", "Buona Vista", "Commonwealth", "Queenstown",
  "Redhill", "Tiong Bahru", "Outram Park", "Tanjong Pagar", "Raffles Place",
  "City Hall", "Bugis", "Lavender", "Kallang", "Aljunied", "Paya Lebar",
  "Eunos", "Kembangan", "Bedok", "Tanah Merah", "Expo", "Changi Airport",
  "Simei", "Tampines", "Pasir Ris",
];

export const CircleLine = [
  "Marina Bay", "Bayfront", "Dhoby Ghaut", "Bras Basah", "Esplanade",
  "Promenade", "Nicoll Highway", "Stadium", "Mountbatten", "Dakota",
  "Paya Lebar", "MacPherson", "Tai Seng", "Bartley", "Serangoon",
  "Lorong Chuan", "Bishan", "Marymount", "Caldecott", "Botanic Gardens",
  "Farrer Road", "Holland Village", "Buona Vista", "one-north", "Kent Ridge",
  "Haw Par Villa", "Pasir Panjang", "Labrador Park", "Telok Blangah",
  "HarbourFront",
];

export const NorthSouthLine = [
  "Marina South Pier", "Marina Bay", "Raffles Place", "City Hall",
  "Dhoby Ghaut", "Somerset", "Orchard", "Newton", "Novena", "Toa Payoh",
  "Braddell", "Bishan", "Ang Mo Kio", "Yio Chu Kang", "Khatib", "Yishun",
  "Canberra", "Sembawang", "Admiralty", "Woodlands", "Marsiling", "Kranji",
  "Yew Tee", "Choa Chu Kang", "Bukit Gombak", "Bukit Batok", "Jurong East",
];

export const NorthEastLine = [
  "HarbourFront", "Outram Park", "Chinatown", "Clarke Quay", "Dhoby Ghaut",
  "Little India", "Farrer Park", "Boon Keng", "Potong Pasir", "Woodleigh",
  "Serangoon", "Kovan", "Hougang", "Buangkok", "Sengkang", "Punggol",
  "Punggol Coast",
];

export const ThomsonEastCoastLine = [
  "Woodlands North", "Woodlands", "Woodlands South", "Springleaf", "Lentor",
  "Mayflower", "Bright Hill", "Upper Thomson", "Caldecott", "Stevens",
  "Napier", "Orchard Boulevard", "Orchard", "Great World", "Havelock",
  "Outram Park", "Maxwell", "Shenton Way", "Marina Bay", "Gardens by the Bay",
  "Tanjong Rhu", "Katong Park", "Tanjong Katong", "Marine Parade",
  "Marine Terrace", "Siglap", "Bayshore", "Bedok South", "Sungei Bedok",
];

/** Returns the deduplicated set of all stations across all lines. */
export function getAllStations(): string[] {
  return Array.from(new Set([
    ...DowntownLine,
    ...EastWestLine,
    ...CircleLine,
    ...NorthSouthLine,
    ...NorthEastLine,
    ...ThomsonEastCoastLine,
  ]));
}

/** Returns `n` randomly sampled stations without replacement. */
export function sampleStations(n: number): string[] {
  const pool = getAllStations();
  const result: string[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}
