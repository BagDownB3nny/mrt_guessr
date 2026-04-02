/**
 * Station → zone mapping for the hint system.
 * Zone: North | South | East | West | Central
 */

export const STATION_ZONES: Record<string, string> = {
  // NSL
  "Marina South Pier": "South", "Marina Bay": "South", "Raffles Place": "Central",
  "City Hall": "Central", "Dhoby Ghaut": "Central", "Somerset": "Central",
  "Orchard": "Central", "Newton": "Central", "Novena": "Central",
  "Toa Payoh": "Central", "Braddell": "Central", "Bishan": "Central",
  "Ang Mo Kio": "North", "Yio Chu Kang": "North", "Khatib": "North",
  "Yishun": "North", "Canberra": "North", "Sembawang": "North",
  "Admiralty": "North", "Woodlands": "North", "Marsiling": "North",
  "Kranji": "North", "Yew Tee": "North", "Choa Chu Kang": "West",
  "Bukit Gombak": "West", "Bukit Batok": "West", "Jurong East": "West",
  // EWL
  "Tuas Link": "West", "Tuas Crescent": "West", "Gul Circle": "West",
  "Joo Koon": "West", "Pioneer": "West", "Boon Lay": "West",
  "Lakeside": "West", "Chinese Garden": "West", "Clementi": "West",
  "Dover": "West", "Buona Vista": "West", "Commonwealth": "Central",
  "Queenstown": "Central", "Redhill": "Central", "Tiong Bahru": "Central",
  "Outram Park": "Central", "Tanjong Pagar": "Central", "Lavender": "Central",
  "Kallang": "Central", "Aljunied": "East", "Paya Lebar": "East",
  "Eunos": "East", "Kembangan": "East", "Bedok": "East",
  "Tanah Merah": "East", "Simei": "East", "Tampines": "East",
  "Pasir Ris": "East", "Expo": "East", "Changi Airport": "East",
  "Bugis": "Central",
  // CCL
  "Bayfront": "South", "Bras Basah": "Central", "Esplanade": "Central",
  "Promenade": "Central", "Nicoll Highway": "Central", "Stadium": "Central",
  "Mountbatten": "Central", "Dakota": "Central", "MacPherson": "East",
  "Tai Seng": "East", "Bartley": "East", "Serangoon": "East",
  "Lorong Chuan": "Central", "Marymount": "Central", "Caldecott": "Central",
  "Botanic Gardens": "Central", "Farrer Road": "Central", "Holland Village": "West",
  "one-north": "West", "Kent Ridge": "West", "Haw Par Villa": "West",
  "Pasir Panjang": "West", "Labrador Park": "South", "Telok Blangah": "South",
  "HarbourFront": "South",
  // NEL
  "Clarke Quay": "Central", "Chinatown": "Central", "Little India": "Central",
  "Farrer Park": "Central", "Boon Keng": "Central", "Potong Pasir": "Central",
  "Woodleigh": "Central", "Kovan": "East", "Hougang": "East",
  "Buangkok": "East", "Sengkang": "East", "Punggol": "East",
  "Punggol Coast": "East",
  // DTL
  "Bukit Panjang": "West", "Cashew": "West", "Hillview": "West",
  "Hume": "West", "Beauty World": "West", "King Albert Park": "West",
  "Sixth Avenue": "West", "Tan Kah Kee": "Central", "Stevens": "Central",
  "Rochor": "Central", "Downtown": "South", "Telok Ayer": "Central",
  "Fort Canning": "Central", "Bencoolen": "Central", "Jalan Besar": "Central",
  "Bendemeer": "Central", "Geylang Bahru": "East", "Mattar": "East",
  "Ubi": "East", "Kaki Bukit": "East", "Bedok North": "East",
  "Bedok Reservoir": "East", "Tampines West": "East", "Tampines East": "East",
  "Upper Changi": "East", "Xilin": "East", "Sungei Bedok": "East",
  // TEL
  "Woodlands North": "North", "Woodlands South": "North", "Springleaf": "North",
  "Lentor": "North", "Mayflower": "North", "Bright Hill": "North",
  "Upper Thomson": "North", "Napier": "Central", "Orchard Boulevard": "Central",
  "Great World": "Central", "Havelock": "Central", "Maxwell": "Central",
  "Shenton Way": "Central", "Gardens by the Bay": "South",
  "Tanjong Rhu": "East", "Katong Park": "East", "Tanjong Katong": "East",
  "Marine Parade": "East", "Marine Terrace": "East", "Siglap": "East",
  "Bayshore": "East", "Bedok South": "East",
};

export function getZoneForStation(station: string): string | null {
  return STATION_ZONES[station] ?? null;
}
