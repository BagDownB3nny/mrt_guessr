"use client";
import { useEffect, useState } from "react";
import React from "react";
import "../styles/global.css";
import FixedBar from "../components/FixedBar";
import MrtMapController from "../components/MrtMapController";

const DowntownLineStations = [
  "Bukit Panjang",
  "Cashew",
  "Hillview",
  "Beauty World",
  "King Albert Park",
  "Sixth Avenue",
  "Tan Kah Kee",
  "Botanic Gardens",
  "Stevens",
  "Newton",
  "Little India",
  "Rochor",
  "Bugis",
  "Promenade",
  "Bayfront",
  "Downtown",
  "Telok Ayer",
  "Chinatown",
  "Fort Canning",
  "Bencoolen",
  "Jalan Besar",
  "Bendemeer",
  "Geylang Bahru",
  "Mattar",
  "MacPherson",
  "Ubi",
  "Kaki Bukit",
  "Bedok North",
  "Bedok Reservoir",
  "Tampines West",
  "Tampines",
  "Tampines East",
  "Upper Changi",
  "Expo",
];

const EastWestLineStations = [
  "Tuas Link",
  "Tuas West Road",
  "Tuas Crescent",
  "Gul Circle",
  "Joo Koon",
  "Pioneer",
  "Boon Lay",
  "Lakeside",
  "Chinese Garden",
  "Jurong East",
  "Clementi",
  "Dover",
  "Buona Vista",
  "Commonwealth",
  "Queenstown",
  "Redhill",
  "Tiong Bahru",
  "Outram Park",
  "Tanjong Pagar",
  "Raffles Place",
  "City Hall",
  "Bugis",
  "Lavender",
  "Kallang",
  "Aljunied",
  "Paya Lebar",
  "Eunos",
  "Kembangan",
  "Bedok",
  "Tanah Merah",
  "Expo",
  "Changi Airport",
  "Simei",
  "Tampines",
  "Pasir Ris",
];

const CircleLineStations = [
  "Marina Bay",
  "Bayfront",
  "Dhoby Ghaut",
  "Bras Basah",
  "Esplanade",
  "Promenade",
  "Nicoll Highway",
  "Stadium",
  "Mountbatten",
  "Dakota",
  "Paya Lebar",
  "MacPherson",
  "Tai Seng",
  "Bartley",
  "Serangoon",
  "Lorong Chuan",
  "Bishan",
  "Marymount",
  "Caldecott",
  "Botanic Gardens",
  "Farrer Road",
  "Holland Village",
  "Buona Vista",
  "one-north",
  "Kent Ridge",
  "Haw Par Villa",
  "Pasir Panjang",
  "Labrador Park",
  "Telok Blangah",
  "HarbourFront",
];

const NorthSouthLineStations = [
  "Marina South Pier",
  "Marina Bay",
  "Raffles Place",
  "City Hall",
  "Dhoby Ghaut",
  "Somerset",
  "Orchard",
  "Newton",
  "Novena",
  "Toa Payoh",
  "Braddell",
  "Bishan",
  "Ang Mo Kio",
  "Yio Chu Kang",
  "Khatib",
  "Yishun",
  "Canberra",
  "Sembawang",
  "Admiralty",
  "Woodlands",
  "Marsiling",
  "Kranji",
  "Yew Tee",
  "Choa Chu Kang",
  "Bukit Gombak",
  "Bukit Batok",
  "Jurong East",
];

const NorthEastLineStations = [
  "HarbourFront",
  "Outram Park",
  "Chinatown",
  "Clarke Quay",
  "Dhoby Ghaut",
  "Little India",
  "Farrer Park",
  "Boon Keng",
  "Potong Pasir",
  "Woodleigh",
  "Serangoon",
  "Kovan",
  "Hougang",
  "Buangkok",
  "Sengkang",
  "Punggol",
];

const ThomsonEastCoastLineStations = [
  "Woodlands North",
  "Woodlands",
  "Woodlands South",
  "Springleaf",
  "Lentor",
  "Mayflower",
  "Bright Hill",
  "Upper Thomson",
  "Caldecott",
  "Stevens",
  "Napier",
  "Orchard Boulevard",
  "Orchard",
  "Great World",
  "Havelock",
  "Outram Park",
  "Maxwell",
  "Shenton Way",
  "Marina Bay",
  "Gardens by the Bay",
];

const getAllStations = (): String[] => {
  const allStations = new Set<String>();
  DowntownLineStations.forEach((station) => allStations.add(station));
  EastWestLineStations.forEach((station) => allStations.add(station));
  CircleLineStations.forEach((station) => allStations.add(station));
  NorthSouthLineStations.forEach((station) => allStations.add(station));
  NorthEastLineStations.forEach((station) => allStations.add(station));
  ThomsonEastCoastLineStations.forEach((station) => allStations.add(station));
  return Array.from(allStations);
};

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export default function Home() {
  const [unseenstations, setUnseenStations] = useState<String[]>(
    getAllStations()
  );
  const [currentStation, setCurrentStation] = useState<String>("");
  const [clickedStations, setClickedStations] = useState<String[]>([]);
  const [newlyCorrectStation, setNewlyCorrectStation] = useState<String>("");
  const [tries, setTries] = useState<number>(3);

  const getNewStation = () => {
    const index = getRandomInt(unseenstations.length);
    const newStation = unseenstations[index];
    setCurrentStation(newStation);
    unseenstations.splice(index, 1);
    setUnseenStations(unseenstations);
  };

  const onCorrectClick = (station: String) => {
    setClickedStations((prev) => [...prev, station]);
    getNewStation();
    setNewlyCorrectStation(station);
    setTries(3);
  };

  const onWrongClick = () => {
    setTries((prev) => prev - 1);
  };

  useEffect(() => {
    getNewStation();
  }, []);

  return (
    <>
      <FixedBar currentStation={currentStation} tries={tries} />
      <div style={{ width: "100vw", height: "100vh", borderStyle: "solid" }}>
        <MrtMapController
          onCorrectClick={onCorrectClick}
          onWrongClick={onWrongClick}
          currentStation={currentStation}
          newlyCorrectStation={newlyCorrectStation}
          tries={tries}
        />
      </div>
    </>
  );
}
