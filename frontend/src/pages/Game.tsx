"use client";
import { useEffect, useState } from "react";
import FixedBar from "../components/FixedBar";
import MrtMapController from "../components/MrtMapController";
import styles from "../css/Game.module.css";
import GameFinishModal from "../components/GameFinishModal";
import { useNavigate } from "react-router-dom";

const DowntownLineStations = [
  "Bukit Panjang",
  "Cashew",
  "Hillview",
  "Hume",
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
  "Xilin",
  "Sungei Bedok",
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
  "Punggol Coast",
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
  "Tanjong Rhu",
  "Katong Park",
  "Tanjong Katong",
  "Marine Parade",
  "Marine Terrace",
  "Siglap",
  "Bayshore",
  "Bedok South",
  "Sungei Bedok",
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

const getNStations = (n: number) => {
  const allStations = getAllStations();
  const nStations = [];
  for (let i = 0; i < n; i++) {
    const index = getRandomInt(allStations.length);
    nStations.push(allStations[index]);
    allStations.splice(index, 1);
  }
  return nStations;
};

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export enum GameType {
  QUICKGAME,
  SINGAPORETOUR,
}

export default function Game(props: any) {
  const { gameType } = props;
  const [unseenStations, setUnseenStations] = useState<String[]>([]);
  const [currentStation, setCurrentStation] = useState<String>("");
  const [clickedStations, setClickedStations] = useState<String[]>([]);
  const [newlyCorrectStation, setNewlyCorrectStation] = useState<String>("");
  const [tries, setTries] = useState<number>(3);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);

  const [stationsGuessedInOneTry, setStationsGuessedInOneTry] = useState(0);
  const [stationsGuessedInTwoTries, setStationsGuessedInTwoTries] = useState(0);
  const [stationsGuessedInThreeTries, setStationsGuessedInThreeTries] =
    useState(0);
  const [stationsGuessedAfterThreeTries, setStationsGuessedAfterThreeTries] =
    useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const preventGesture = (event: any) => {
      event.preventDefault(); // Prevent default iOS behavior
    };

    document.addEventListener("gesturestart", preventGesture);
    document.addEventListener("gesturechange", preventGesture);
    document.addEventListener("gestureend", preventGesture);

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
    };
  }, []);

  const getStationsLeft = () => {
    const stationsFound = clickedStations.length;
    let totalStations = stationsFound + unseenStations.length;
    if (currentStation) {
      totalStations++;
    }
    return `${stationsFound}/${totalStations}`;
  };

  const getScore = () => {
    const stationsFound = clickedStations.length;
    return `${currentScore}/${stationsFound * 3}`;
  };

  const getNewStation = () => {
    const index = getRandomInt(unseenStations.length);
    const newStation = unseenStations[index];
    setCurrentStation(newStation);
    unseenStations.splice(index, 1);
    setUnseenStations(unseenStations);
  };

  const updateStationsFoundInTries = (tries: number) => {
    switch (tries) {
      case 3:
        setStationsGuessedInOneTry((prev) => prev + 1);
        break;
      case 2:
        setStationsGuessedInTwoTries((prev) => prev + 1);
        break;
      case 1:
        setStationsGuessedInThreeTries((prev) => prev + 1);
        break;
      case 0:
        setStationsGuessedAfterThreeTries((prev) => prev + 1);
        break;
    }
  };

  const onCorrectClick = (station: String, tries: number) => {
    if (tries < 0) {
      tries = 0;
    }
    updateStationsFoundInTries(tries);
    setCurrentScore((prev) => prev + tries);
    setClickedStations((prev) => [...prev, station]);
    getNewStation();
    setNewlyCorrectStation(station);
    setTries(3);
    if (unseenStations.length === 0) {
      onGameEnd();
    }
  };

  const onWrongClick = () => {
    setTries((prev) => prev - 1);
  };

  const onGameEnd = () => {
    setModalOpen(true);
  };

  const restartGame = () => {
    if (gameType === GameType.QUICKGAME) {
      navigate("/quickgame");
    } else if (gameType === GameType.SINGAPORETOUR) {
      navigate("/singaporetour");
    }
  };

  useEffect(() => {
    if (gameType === GameType.QUICKGAME) {
      setUnseenStations(getNStations(1));
    } else if (gameType === GameType.SINGAPORETOUR) {
      setUnseenStations(getAllStations());
    }
  }, []);

  useEffect(() => {
    if (!currentStation && unseenStations.length > 0) {
      getNewStation();
    }
  }, [unseenStations]);

  return (
    <div className={styles.GameContainer}>
      <MrtMapController
        onCorrectClick={onCorrectClick}
        onWrongClick={onWrongClick}
        currentStation={currentStation}
        newlyCorrectStation={newlyCorrectStation}
        tries={tries}
      />
      <FixedBar
        currentStation={currentStation}
        tries={tries}
        getScore={getScore}
        getStationsLeft={getStationsLeft}
        setModalOpen={setModalOpen}
        restartGame={restartGame}
      />
      <GameFinishModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        stationsGuessedInOneTry={stationsGuessedInOneTry}
        stationsGuessedInTwoTries={stationsGuessedInTwoTries}
        stationsGuessedInThreeTries={stationsGuessedInThreeTries}
        stationsGuessedAfterThreeTries={stationsGuessedAfterThreeTries}
        getScore={getScore}
      />
    </div>
  );
}
