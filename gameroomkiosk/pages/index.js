import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';

const GameDetails = ({ gameCode }) => {
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playersData, setPlayersData] = useState([]);
  const [highScores, setHighScores] = useState({ today: 0, last90Days: 0, last360Days: 0 });
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStartButtonEnabled, setIsStartButtonEnabled] = useState(false); // State to enable/disable start button
  const [gameStatus, setGameStatus] = useState(''); // State to track game status
  const [isCardScanned, setIsCardScanned] = useState(false); // State to track if card is scanned
  
  const API_BASE_URL = 'http://localhost:3000/api/game/';



      const [webSocket, setWebSocket] = useState(null);
  
      useEffect(() => {
          // Create WebSocket connection.
          const socket = new WebSocket('ws://10.0.0.250:8080');
  
          // Connection opened
          socket.addEventListener('open', (event) => {
              console.log('WebSocket is connected');
          });
  alert(1);
  console.log('connected')
          // Listen for messages
          socket.addEventListener('message', (event) => {
              console.log('Message from server ', event.data);
          });
  
          // Handle any errors that occur.
          socket.addEventListener('error', (error) => {
              console.error('WebSocket Error: ', error);
          });
  
          // Set the websocket in the state
          setWebSocket(socket);
  
          // Clean up on unmount
          return () => {
              socket.close();
          };
      }, []); // Empty array ensures that effect is only run on mount and unmount
  
      return (
          <div>
              <h1>WebSocket Example</h1>
              <button onClick={() => {
                  if (webSocket) {
                      webSocket.send('Hello Server!'); // Send data to the server
                  }
              }}>
                  Send Message
              </button>
          </div>
      );

  
  
  useEffect(() => {


    if (gameCode) {
      fetch(`${API_BASE_URL}findByGameCode/?gameCode=${gameCode}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          setGameData(data);
          if (data[0] && data[0].variants.length > 0) {
            setSelectedVariant(data[0].variants[0]); // Select first variant by default
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error:', error);
          setError(error);
          setLoading(false);
        });
    }
  }, [gameCode]);

  useEffect(() => {
    if (isCardScanned) { // Start polling only if the card has been scanned
      const fetchGameStatus = () => {
        if (gameData && gameData.IpAddress && gameData.LocalPort) {
          fetch(`http://localhost:3000/api/game-status?gameCode=${encodeURIComponent(gameCode)}&IpAddress=${encodeURIComponent(gameData.IpAddress)}&port=${encodeURIComponent(gameData.LocalPort)}`)
            .then(response => response.json())
            .then(data => {
              setGameStatus(data.status);
              // Disable start button if game status is "Running"
              if (data.status === 'Running') {
                setIsStartButtonEnabled(false);
              }
            })
            .catch(error => {
              console.error('Error fetching game status:', error);
            });
        }
      };

      // Fetch the game status every second
      const intervalId = setInterval(fetchGameStatus, 1000);

      // Cleanup the interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [isCardScanned, gameCode, gameData]);

  useEffect(() => {
    // Fetch the highest scores for today, 90 days, and 360 days
    fetch(`http://localhost:3000/api/stats/highestScores`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching high scores: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setHighScores({
          today: data.highestToday || 0,
          last90Days: data.highest90Days || 0,
          last360Days: data.highestAllTime || 0,
        });
      })
      .catch((error) => {
        console.error('Error fetching high scores:', error);
        setError(error);
      });

    // Register a global function to receive messages from WPF
    window.receiveMessageFromWPF = function (message) {
      console.log("Received message from WPF:", message);
      // Fetch player information using the WristbandTranID
      fetchPlayerInfo(message);
    };

    // Cleanup function to remove the global function
    return () => {
      delete window.receiveMessageFromWPF;
    };
  }, []);

  const fetchPlayerInfo = (wristbandTranID) => {
    // Check if the wristbandTranID is already in playersData
    if (playersData.some(player => player.wristbandTranID === wristbandTranID)) {
      console.log('Wristband already tapped.');
      return;
    }
    if (playersData.length >= 5) {
      console.log('Maximum number of players reached');
      return;
    }

    fetch(`http://localhost:3000/api/wristbandtran/getplaysummary?wristbanduid=${wristbandTranID}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error fetching player data: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setPlayersData(prevPlayers => {
          const updatedPlayers = [...prevPlayers, { ...data, wristbandTranID }];
          if (updatedPlayers.length > 0) {
            setIsStartButtonEnabled(true); // Enable start button when at least one wristband is scanned
            setIsCardScanned(true); // Set card scanned to true to start polling game status
          }
          return updatedPlayers;
        });
      })
      .catch((error) => {
        console.error('Error fetching player data:', error);
        setError(error);
      });
  };

  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleStartButtonClick = () => {
    // Ensure all required variables are defined
    if (selectedVariant && gameCode && gameData && gameData.IpAddress && gameData.LocalPort) {
      const url = `http://localhost:3000/api/start-game?gameCode=${encodeURIComponent(gameCode)}&variantCode=${encodeURIComponent(selectedVariant.name)}&ip=${encodeURIComponent(gameData.IpAddress)}&port=${encodeURIComponent(gameData.LocalPort)}`;
    
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error starting game: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log(`Game started: ${data.message}`);
          
          // Poll the game status after starting the game
          const checkGameStatus = () => {
            fetch(`http://localhost:3000/api/game-status?gameCode=${encodeURIComponent(gameCode)}&IpAddress=${encodeURIComponent(gameData.IpAddress)}&port=${encodeURIComponent(gameData.LocalPort)}`)
              .then(response => response.json())
              .then(data => {
                alert(data.status);
                if (data.status === 'Running') {
                  console.log('Game is running');
  
                  // Refresh the page after 10 seconds
                  setTimeout(() => {
                    window.location.reload();
                  }, 10000);
                }
              })
              .catch(error => {
                console.error('Error fetching game status:', error);
              });
          };
  
  
        })
        .catch(error => {
          console.error('Error starting game:', error);
        });
    } else {
      console.error('Missing required information to start the game.');
    }
  };
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!gameData) return <p>No data found for game code: {gameCode}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <h1 className={styles.sectionTitle}>{gameData.gameName}</h1>
        <p>{gameData.gameDescription}</p>
        <div className={styles.scoreTable}>
          <div className={styles.tableRow}>
            <div>Player Name</div>
            <div>Time Left</div>
            <div>High Score</div>
            <div>Team Reward</div>
          </div>
          {playersData.map((playerInfo, index) => (
            <div key={index} className={styles.tableRow}>
              <div>{playerInfo.player.FirstName} {playerInfo.player.LastName}</div>
              <div>{playerInfo.timeleft}</div>
              <div>{playerInfo.totalScore}</div>
              <div>{playerInfo.reward}</div>
            </div>
          ))}
        </div>
        <div className={styles.highScores}>
          <h3>High Scores</h3>
          <div className={styles.scoreCategories}>
            <div className={styles.scoreBox}>
              <div className={styles.scoreTitle}>Today</div>
              <div className={styles.scoreValue}>{highScores.today}</div>
            </div>
            <div className={styles.scoreBox}>
              <div className={styles.scoreTitle}>90 Days</div>
              <div className={styles.scoreValue}>{highScores.last90Days}</div>
            </div>
            <div className={styles.scoreBox}>
              <div className={styles.scoreTitle}>360 Days</div>
              <div className={styles.scoreValue}>{highScores.last360Days}</div>
            </div>
          </div>
          <button className={styles.resetButton}>RESET</button>
        </div>
      </div>
      <div className={styles.rightSection}>
        <h2 className={styles.sectionTitle}>Game Selection</h2>
        <div className={styles.gameOptions}>
          {gameData.variants.map((variant) => (
            <div
              key={variant.ID}
              className={`${styles.gameOption} ${selectedVariant && selectedVariant.ID === variant.ID ? styles.selected : ''}`}
              onClick={() => handleVariantClick(variant)}
            >
              {variant.name}
            </div>
          ))}
        </div>
        <div className={styles.levelSelector}>
          <h3>Level</h3>
          <div className={styles.levelDots}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        </div>
        <button
          className={styles.startButton}
          onClick={handleStartButtonClick} // Call the function when the start button is clicked
          disabled={!isStartButtonEnabled || !selectedVariant || gameStatus === 'Running'} // Disable the button if no wristband is scanned or game is running
        >
          {gameStatus === 'Running' ? 'PLEASE WAIT UNTIL THE GAME ENDS': 'START'}
        </button>
      </div>
      {isModalOpen && selectedVariant && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button className={styles.closeButton} onClick={closeModal}>X</button>
            <h2>{selectedVariant.name}</h2>
            <div dangerouslySetInnerHTML={{ __html: selectedVariant.instructions }} />
          </div>
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const router = useRouter();
  const { gameCode } = router.query;

  return <GameDetails gameCode={gameCode} />;
};

export default Home;
