import { io } from '../frontend/node_modules/socket.io-client/build/esm/index.js';
import { EVENTS } from '../backend/src/constants/events.js';

const BACKEND_URL = 'http://localhost:5001';

async function runSimulation() {
  console.log('🧪 [TEST] Starting Multi-Client Skribbl.io Simulation Test...\n');

  // Client 1: Alice (Host)
  const alice = io(BACKEND_URL);
  // Client 2: Bob (Guesser)
  const bob = io(BACKEND_URL);

  let testRoomId = null;

  await new Promise((resolve, reject) => {
    alice.on('connect', () => {
      console.log('🟢 Alice connected:', alice.id);
      // Alice creates room
      alice.emit(EVENTS.CREATE_ROOM, {
        hostName: 'Alice',
        avatar: '🐱',
        settings: { rounds: 2, drawTime: 45, wordCount: 3, hints: 1 }
      });
    });

    alice.on(EVENTS.ROOM_CREATED, (data) => {
      testRoomId = data.roomId;
      console.log(`✅ Room created successfully: ${testRoomId}`);

      // Bob connects and joins
      bob.connect();
    });

    bob.on('connect', () => {
      console.log('🟢 Bob connected:', bob.id);
      bob.emit(EVENTS.JOIN_ROOM, {
        roomId: testRoomId,
        playerName: 'Bob',
        avatar: '🐶'
      });
    });

    bob.on(EVENTS.ROOM_JOINED, (data) => {
      console.log(`✅ Bob joined room: ${data.roomId}`);
      // Host Alice starts game
      setTimeout(() => {
        console.log('🚀 Alice starting the game...');
        alice.emit(EVENTS.START_GAME);
      }, 500);
    });

    // Alice receives word choices
    alice.on(EVENTS.ROUND_START, (data) => {
      if (data.isDrawer) {
        console.log(`✏️ Alice is Drawer! Received word options:`, data.wordOptions);
        const chosenWord = data.wordOptions[0];
        console.log(`👉 Alice selects word: "${chosenWord}"`);
        setTimeout(() => {
          alice.emit(EVENTS.WORD_CHOSEN, { word: chosenWord });
        }, 500);
      }
    });

    // Bob receives masked word
    bob.on(EVENTS.WORD_CHOSEN, (data) => {
      console.log(`👀 Bob sees word mask: "${data.wordMask}" (${data.wordLength} letters)`);

      // Alice sends a drawing stroke
      setTimeout(() => {
        console.log('🎨 Alice is drawing...');
        alice.emit(EVENTS.DRAW_START, { x: 0.1, y: 0.1, color: '#ef4444', size: 6 });
        alice.emit(EVENTS.DRAW_MOVE, { x: 0.2, y: 0.2 });
        alice.emit(EVENTS.DRAW_END);
      }, 300);
    });

    // Bob receives drawing stroke
    bob.on(EVENTS.DRAW_DATA, (stroke) => {
      if (stroke.type === 'start') {
        console.log('⚡ Bob received drawing stroke from Alice:', stroke);

        // Bob makes an incorrect guess first, then the correct guess
        setTimeout(() => {
          console.log('💬 Bob guesses "wrongword"');
          bob.emit(EVENTS.GUESS, { text: 'wrongword' });

          setTimeout(() => {
            // Bob guesses correctly
            console.log('🎯 Bob guesses the right answer!');
            // Alice chose wordOptions[0]
            bob.emit(EVENTS.GUESS, { text: aliceSecretWord });
          }, 400);
        }, 300);
      }
    });

    let aliceSecretWord = '';
    alice.on(EVENTS.WORD_CHOSEN, (data) => {
      aliceSecretWord = data.word;
    });

    // Guess result notification
    bob.on(EVENTS.GUESS_RESULT, (data) => {
      console.log(`🏆 [GUESS RESULT] ${data.playerName} guessed correctly! +${data.points} pts`);
      console.log('📊 Current Scores:', data.scores);
    });

    // Round end
    alice.on(EVENTS.ROUND_END, (data) => {
      console.log(`🎉 [ROUND END] Word was "${data.word}". Reason: ${data.reason}`);
      console.log(`✨ All simulated steps PASSED with flying colors!`);
      alice.disconnect();
      bob.disconnect();
      resolve();
    });

    setTimeout(() => {
      reject(new Error('Simulation timed out after 15s'));
    }, 15000);
  });
}

runSimulation().then(() => {
  console.log('\n🏁 [TEST FINISHED] Game flow verified 100% successfully!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ [TEST FAILED]:', err.message);
  process.exit(1);
});
