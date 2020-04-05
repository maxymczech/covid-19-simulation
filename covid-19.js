/* * * Settings * * */
const config = {
  allSicknessStates: ['initial', 'light', 'hardcore', 'immunity'],
  allStatuses: ['healthy', 'sick', 'dead'],
  colors: {
    'healthy': {
      'initial': '#C5F4E0',
      'light': '#C5F4E0',
      'hardcore': '#C5F4E0',
      'immunity': '#C5F4E0'
    },
    'sick': {
      'initial': 'pink',
      'light': 'orange',
      'hardcore': 'red',
      'immunity': '#C5F4E0'
    },
    'dead': {
      'initial': '#666',
      'light': '#666',
      'hardcore': '#666',
      'immunity': '#666'
    }
  },
  currentFrame: 0,
  graphFramesCount: 250,
  gridStepSize: 100, // [px]
  hardcoreModeProbability: 0.4, // Probability of going into hardcore sickness mode
  hardcoreRIP: 0.5, // Probability of DEATH in hardcore sick people
  infectionP: 0.1, // Probability of infecting another person without immunity
  infectionRadius: 20, // Radius of infection reach
  initialSicknessDurationRatio: 0.3, // Portion of sickness period when the person is symptomless
  showGrid: false, // Display grid in the simulation canvas
  sicknessDuration: 500, // Number of frames the person is sick
  sickSpeedMultiplier: 0.5,
  simulationState: 'running', // 'running' | 'paused'
  totalPeople: 500
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

const drawCircle = (ctx, x, y, radius, color, fill = true, dash = []) => {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.setLineDash(dash);
  ctx[fill ? 'fill' : 'stroke']();
}

const drawFrame = (ctx, maxWidth, maxHeight) => {
  ctx.clearRect(0, 0, maxWidth, maxHeight);

  if (config.showGrid) {
    for (let x = 0; x < maxWidth; x += config.gridStepSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, maxHeight);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
    for (let y = 0; y < maxHeight; y += config.gridStepSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(maxWidth, y);
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }

  people.forEach(person => {
    const color = config.colors[person.status][person.sicknessState];
    const dash = [5, 5];
    if (person.status === 'sick') {
      drawCircle(ctx, person.x, person.y, config.infectionRadius, color, false, dash);
    }
    drawCircle(ctx, person.x, person.y, person.radius, color);
    if (person.sicknessState === 'immunity') {
      drawCircle(ctx, person.x, person.y, person.radius + 4, color, false, dash);
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
  const infectablePeople = people.filter(person => (
    person.status === 'healthy' && person.sicknessState !== 'immunity'
  ));
  people.forEach(person => {
    // Movement
    if (person.status !== 'dead') {
      const distanceToGoal = dist(person, {
        x: person.goalX,
        y: person.goalY
      });
      if (distanceToGoal <= goalTolerance) {
        person.goalX = randomInt(person.radius, maxWidth - person.radius);
        person.goalY = randomInt(person.radius, maxHeight - person.radius);
      } else {
        const mul = person.status === 'sick' ? config.sickSpeedMultiplier : 1;
        const speed = Math.min(mul * person.speed, distanceToGoal);
        const dir = {
          x: speed * (person.goalX - person.x) / distanceToGoal,
          y: speed * (person.goalY - person.y) / distanceToGoal
        }
        person.x += dir.x;
        person.y += dir.y;
      }
    }

    // Samoe interesnoe jopta!!!
    if (person.status === 'sick') {
      // Course of the disease
      const sickForFrames = config.currentFrame - person.sicknessStartFrame;
      const symptomlessFrames = Math.round(config.initialSicknessDurationRatio * config.sicknessDuration);
      if (sickForFrames >= config.sicknessDuration) {
        if (person.sicknessState === 'light') {
          person.status = 'healthy';
          person.sicknessState = 'immunity';
        } else if (person.sicknessState === 'hardcore') {
          if (Math.random() < config.hardcoreRIP) {
            person.status = 'dead';
          } else {
            person.status = 'healthy';
            person.sicknessState = 'immunity';
          }
        }
      } else if(sickForFrames >= symptomlessFrames && person.sicknessState === 'initial') {
        person.sicknessState = Math.random() < config.hardcoreModeProbability ? 'hardcore' : 'light';
      }

      // Infection spread
      infectablePeople.forEach(otherPerson => {
        if (
          dist(person, otherPerson) <= config.infectionRadius
          &&
          Math.random() < config.infectionP
        ) {
          infectPerson(otherPerson);
        }
      });
    }
  });

  config.allStatuses.forEach(status => {
    const displayElement = document.getElementById(`counter-${status}`);
    displayElement.innerHTML = people.filter(person => person.status === status).length;
  });
  const displayElement = document.getElementById('counter-immune');
  displayElement.innerHTML = people.filter(person => person.status === 'healthy' && person.sicknessState === 'immunity').length;
  
}

const pauseSimulation = () => {
  config.simulationState = 'paused';
}
const resumeSimulation = () => {
  config.simulationState = 'running';
}

/* * * Run simulation loop * * */
const canvasElement = document.getElementById('canvas-simulation');
canvasElement.width = document.documentElement.clientWidth / 2;
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

    updateGraph();

    config.currentFrame++;
    if (config.currentFrame % updateEvery === 0) {
      drawFrame(ctx, canvasWidth, canvasHeight);
    }
  }
  requestAnimationFrame(simulationLoop);
};

// Graph
const canvasElementGraph = document.getElementById('canvas-graph');
canvasElementGraph.width = document.documentElement.clientWidth / 2;
canvasElementGraph.height = document.documentElement.clientHeight;
const ctxGraph = canvasElement.getContext("2d");
const graphData = {
  labels: Array.from(Array(config.graphFramesCount).keys()),
  datasets: []
};
config.allStatuses.forEach(status => {
  graphData.datasets.push({
    backgroundColor: config.colors[status].hardcore,
    borderColor: config.colors[status].hardcore,
    data: Array(config.graphFramesCount).fill(0),
    label: status,
    pointRadius: 0
  });
});
const graphOptions = {
  animation: false,
  elements: {
    line: {
      tension: 0.000001
    }
  },
  scales: {
    yAxes: [{
      stacked: true,
      ticks: {
        suggestedMin: 0,
        suggestedMax: config.totalPeople
      } 
    }]
  },
};    
const chartGraph = new Chart('canvas-graph', {
  type: 'line',
  data: graphData,
  options: graphOptions
});

const updateGraph = () => {
  const counts = config.allStatuses.map(status => ({
    status,
    count: people.filter(person => person.status === status).length
  }));
  if (config.currentFrame < config.graphFramesCount) {
    graphData.datasets.forEach(dataset => {
      dataset.data[config.currentFrame] = counts.find(item => item.status === dataset.label).count;
    });
  } else {
    graphData.datasets.forEach(dataset => {
      dataset.data.shift();
      dataset.data.push(counts.find(item => item.status === dataset.label).count);
    });
    graphData.labels.shift();
    graphData.labels.push(config.currentFrame);
  }
  chartGraph.update();
};

simulationLoop();
