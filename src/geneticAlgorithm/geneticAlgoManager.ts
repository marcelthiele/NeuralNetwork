import { NeuralNetwork } from "../network/neuralnetwork";

export class GeneticRequirement {
  constructor(
    public id: string,
    public score: number,
    public brain: NeuralNetwork
  ) {}
}

export class GeneticAlgoFactory {
  generation = 1;
  prevAvgScore = 0;
  avgScore = 0;
  birdsAlive = 0;
  prevHighScore = 0;

  prevHighScoreArray: number[] = [0];
  avgScoreArray: number[] = [0];

  allTimeBest: GeneticRequirement[] = [];

  constructor(private numOfAgents = 200) {}

  getAvgScore(birds: GeneticRequirement[]) {
    let sumOfScore = 0;

    for (let bird of birds) {
      sumOfScore += bird.score;
    }

    this.avgScore = sumOfScore / birds.length;

    // console.log("Average Score: " + this.avgScore);
    return this.avgScore;
  }

  computeNextGeneration(birds: GeneticRequirement[]) {
    this.prevAvgScore = this.getAvgScore(birds);
    this.avgScoreArray.push(this.prevAvgScore);
    this.prevHighScoreArray.push();

    let birdsToKeep = 20;
    let numOfRandomBirds = 20;
    let numOfMutatedBirdsPerATB = 2;
    let numOfCrossovers = 50;
    // console.log('fittest: ' + JSON.stringify(fittest.probabilities));

    let fittestBirds: GeneticRequirement[] = this.getFittestBirds(birds, birdsToKeep);
    this.updateBestBirds(fittestBirds);

    let fittest = this.getRespawnProbabilitiesAndSum(
      [...fittestBirds, ...this.allTimeBest],
      birdsToKeep
    );
    fittestBirds = fittest.newBirds;

    birds = [];

    // Copy previous Best Birds to Next generation
    for (let i = 0; i < birdsToKeep; i++) {
      let newAi = fittestBirds[i].brain.deepCopy();
      let newBird = new GeneticRequirement("f" + i, 0, newAi);
      birds.push(newBird);
    }

    //Copy allTimeBest
    for (let i = 0; i < this.allTimeBest.length; i++) {
      let newAi = this.allTimeBest[i].brain.deepCopy();

      //Also put a slightly mutated bird of that alltimebest bird
      for (let j = 0; j < numOfMutatedBirdsPerATB; j++) {
        let newBird = new GeneticRequirement(this.allTimeBest[i].id + "*", 0, newAi.deepCopy());
        newBird.brain.mutate(
          (0.05 * (j / numOfMutatedBirdsPerATB)) / ((1 / 1.5) * this.generation)
        );
        birds.push(newBird);
      }
    }

    //Do Crossovers
    for (let i = 0; i < numOfCrossovers; i++) {
      let birdA = birds[Math.floor(Math.random() * (birds.length - 1))];
      let birdB = birds[Math.floor(Math.random() * (birds.length - 1))];

      let newAi = this.crossover(birdA, birdB);
      let newBird = new GeneticRequirement("crossover - " + i, 0, newAi);

      birds.push(newBird);
    }

    //Generate some random birds
    for (let i = 0; i < numOfRandomBirds; i++) {
      let newBird = new GeneticRequirement("Rndm - " + i, 0, new NeuralNetwork(birds[0].brain.getNumOfNeurons()));
      birds.push(newBird);
    }

    //Generate and mutate new Birds from
    for (let i = birds.length; i < this.numOfAgents; i++) {
      let probabilityIndex = this.getProbabilityIndex(
        fittest.newBirds,
        fittest.probabilities
      );
      let newAi = fittestBirds[probabilityIndex].brain.deepCopy();
      let newBird = new GeneticRequirement(""+i,0,newAi);
      newBird.brain.mutate(
        (0.5 * (i / this.numOfAgents)) / (0.2 * this.generation)
      );
      birds.push(newBird);
    }

    this.generation++;

    return birds;
  }

  getFittestBirds(birds: GeneticRequirement[], topX: number) {
    let newBirds: GeneticRequirement[] = [];

    for (let i = 0; i < topX; i++) {
      newBirds.push(birds[i]);
    }

    for (let bird of birds) {
      let weakestIndex = 0;
      let weakest = newBirds[weakestIndex];
      for (let i = 0; i < newBirds.length; i++) {
        if (
          newBirds[i].score >= weakest.score &&
          newBirds[i].id != weakest.id
        ) {
          weakest = newBirds[i];
          weakestIndex = i;
        }
      }

      if (bird.score > weakest.score && bird.id != weakest.id) {
        newBirds[weakestIndex] = bird;
      }
    }

    return newBirds;
  }

  getRespawnProbabilitiesAndSum(birds: GeneticRequirement[], topX: number) {
    let probabilities: number[] = [];

    let sum = 0;
    for (let i = 0; i < topX; i++) {
      sum += birds[i].score;
    }

    for (let i = 0; i < topX; i++) {
      probabilities.push(birds[i].score / sum);
    }

    return {
      newBirds: birds,
      probabilities: probabilities,
      sumOfScore: sum,
    };
  }

  updateBestBirds(newFittestBirds: GeneticRequirement[]) {
    if (this.allTimeBest.length == 0) {
      this.allTimeBest = newFittestBirds;
      return;
    }

    for (let newBird of newFittestBirds) {
      let weakestBird = this.allTimeBest[0];
      let weakestIndex = 0;
      // console.log("---------");

      for (let i = 0; i < this.allTimeBest.length; i++) {
        if (
          this.allTimeBest[i].score <= weakestBird.score &&
          this.allTimeBest[i].id != weakestBird.id
        ) {
          weakestBird = this.allTimeBest[i];
          weakestIndex = i;
          // console.log("found new weakest: " + weakestBird.id);
        }
      }
      // console.log("---------");

      if (this.allTimeBest[weakestIndex].score < newBird.score) {
        if (!(this.allTimeBest[weakestIndex].id == newBird.id))
          this.allTimeBest[weakestIndex] = newBird;
      }
    }

    for (let bird of this.allTimeBest) {
      bird.id = bird.id.replace("ATB - ", "");
      bird.id = "ATB - " + bird.id;
    }
  }

  getProbabilityIndex(fittestBirds: GeneticRequirement[], probabilities: number[]) {
    let random = Math.random();
    for (let j = 0; j < fittestBirds.length; j++) {
      if (random <= probabilities[j]) return j;
    }

    return fittestBirds.length - 1;
  }

  setHighScore(score: number) {
    this.prevHighScore = score;
    this.prevHighScoreArray.push(score);
  }

  crossover(birdA: GeneticRequirement, birdB: GeneticRequirement) {
    return birdA.brain.crossover(birdB.brain);
  }

}
