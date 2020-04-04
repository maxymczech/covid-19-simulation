/* * * Settings * * */
const config = {
  allSicknessStates: ['initial', 'light', 'hardcore', 'immunity'],
  allStatuses: ['healthy', 'sick', 'dead'],
  currentFrame: 0,
  hardcoreModeProbability: 0.4, // Probability of going into hardcore sickness mode
  hardcoreRIP: 0.5, // Probability of DEATH in hardcore sick people
  initialSicknessDurationRatio: 0.3, // Portion of sickness period when the person is symptomless
  sicknessDuration: 1000, // Number of frames the person is sick
  simulationState: 'running', // 'running' | 'paused'
  totalPeople: 20
};

const people = [];

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
  person.sicknessStartFrame = config.currentFrame;
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

  config.allStatuses.forEach(status => {
    const displayElement = document.getElementById(`counter-${status}`);
    displayElement.innerHTML = people.filter(person => person.status === status).length;
  });
}

const pauseSimulation = () => {
  config.simulationState = 'paused';
}
const resumeSimulation = () => {
  config.simulationState = 'running';
}

/* * * Run simulation loop * * */

const canvasElement = document.getElementById('the-canvas');
canvasElement.width = document.documentElement.clientWidth;
canvasElement.height = document.documentElement.clientHeight;
const ctx = canvasElement.getContext("2d");
const { height: canvasHeight, width: canvasWidth } = canvasElement;

for (let i = 0; i < config.totalPeople; i++) {
  people.push(getRandomPerson(canvasWidth, canvasHeight));
}

const updateEvery = 1;
const simulationLoop = () => {
  if (config.simulationState === 'running') {
    updateSimulationState(people, canvasWidth, canvasHeight);

    config.currentFrame++;
    if (config.currentFrame % updateEvery === 0) {
      drawFrame(ctx, canvasWidth, canvasHeight);
    }
  }
  requestAnimationFrame(simulationLoop);
};

simulationLoop();
