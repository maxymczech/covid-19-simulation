/* * * Settings * * */
const totalPeople = 20;
const sicknessDuration = 1000;
const initialSicknessDuration = Math.round(sicknessDuration * 0.3);
const hardcoreModeP = 0.4;
const hardcoreRIP = 0.5;

let currentFrame = 0;
let simulationState = 'running';

const people = [];
const statuses = ['healthy', 'sick', 'dead'];
const sicknessStates = ['initial', 'light', 'hardcore', 'immunity'];

/* * * Methods * * */

const randomInt = (min, max) => Math.round(Math.random() * (max - min) + min);

const getRandomPerson = (maxWidth, maxHeight, radius = 5, speed = 5) => {
  return {
    radius,
    x: randomInt(radius, maxWidth - radius),
    y: randomInt(radius, maxHeight - radius),
    status: 'healthy', // 'healthy' | 'sick' | 'dead'
    sicknessStartFrame: null,
    sicknessState: 'initial', // 'initial' | 'light' | 'hardcore' | 'immunity'
    speed,
    goalX: randomInt(radius, maxWidth - radius),
    goalY: randomInt(radius, maxHeight - radius)
  }
}

const drawCircle = (ctx, x, y, radius, color, fill = true) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx[fill ? 'fill' : 'stroke']();
}

const drawFrame = (ctx, maxWidth, maxHeight) => {
  const colorDict = {
    'healthy': {
      'initial': '#C5F4E0',
      'light': '#C5F4E0',
      'hardcore': '#C5F4E0',
      'immunity': '#C5F4E0'
    },
    'sick': {
      'initial': 'orange',
      'light': 'pink',
      'hardcore': 'red',
      'immunity': 'blue'
    },
    'dead': {
      'initial': '#666',
      'light': '#666',
      'hardcore': '#666',
      'immunity': '#666'
    }
  };

  ctx.clearRect(0, 0, maxWidth, maxHeight);

  people.forEach(person => {
    drawCircle(ctx, person.x, person.y, person.radius, colorDict[person.status][person.sicknessState]);
    if (person.sicknessState === 'immunity') {
      drawCircle(ctx, person.x, person.y, person.radius + 4, colorDict[person.status][person.sicknessState], false);
    }
  });
}

const dist = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const infectPerson = person => {
  person.status = 'sick';
  person.sicknessStartFrame = currentFrame;
  person.sicknessState = 'initial';
};

const infectRandomPerson = () => {
  const alive = people.filter(person => person.status === 'healthy');
  if (alive.length) {
    const i = randomInt(0, alive.length - 1);
    infectPerson(alive[i]);
  }
}

const killRandomPerson = () => {
  const alive = people.filter(person => person.status !== 'dead');
  if (alive.length) {
    const i = randomInt(0, alive.length - 1);
    alive[i].status = 'dead';
  }
}

const infectProb = p => {
  const alive = people.filter(person => person.status === 'healthy');
  if (alive.length) {
    alive.forEach(person => {
      if (Math.random() < p) {
        infectPerson(person);
      }
    });
  }
}

const updateSimulationState = (people, maxWidth, maxHeight) => {
  const goalTolerance = 3;
  people.forEach(person => {
    if (person.status !== 'dead') {
      const distanceToGoal = dist({
        x: person.x,
        y: person.y
      }, {
        x: person.goalX,
        y: person.goalY
      });
      if (distanceToGoal <= goalTolerance) {
        person.goalX = randomInt(person.radius, maxWidth - person.radius);
        person.goalY = randomInt(person.radius, maxHeight - person.radius);
      } else {
        const dir = {
          x: person.speed * (person.goalX - person.x) / distanceToGoal,
          y: person.speed * (person.goalY - person.y) / distanceToGoal
        }
        person.x += dir.x;
        person.y += dir.y;
      }
    }

    // Samoe interesnoe jopta!!!
    if (person.status === 'sick') {
      // TODO
    }
  });

  statuses.forEach(status => {
    const displayElement = document.getElementById(`counter-${status}`);
    displayElement.innerHTML = people.filter(person => person.status === status).length;
  });
}

const pauseSimulation = () => {
  simulationState = 'paused';
}
const resumeSimulation = () => {
  simulationState = 'running';
}

/* * * * * */

const canvasElement = document.getElementById('the-canvas');
canvasElement.width = document.documentElement.clientWidth;
canvasElement.height = document.documentElement.clientHeight;
const ctx = canvasElement.getContext("2d");
const { height: canvasHeight, width: canvasWidth } = canvasElement;

for (let i = 0; i < totalPeople; i++) {
  people.push(getRandomPerson(canvasWidth, canvasHeight));
}

const updateEvery = 1;
const simulationLoop = () => {
  if (simulationState === 'running') {
    updateSimulationState(people, canvasWidth, canvasHeight);

    currentFrame++;
    if (currentFrame % updateEvery === 0) {
      drawFrame(ctx, canvasWidth, canvasHeight);
    }
  }
  requestAnimationFrame(simulationLoop);
};

simulationLoop();
