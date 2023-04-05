import { NeuralNetwork } from "../network/neuralnetwork";

export class GeneticAlgoFactory {
  generation = 1;
  prevAvgScore = 0;
  avgScore = 0;
  neuralNetsAlive = 0;
  prevHighScore = 0;

  prevHighScoreArray: number[] = [0];
  avgScoreArray: number[] = [0];

  allTimeBest: NeuralNetwork[] = [];

  constructor(
    private numOfNeuralNets = 200,
    public atbMutationRate = 0.05,
    public fittestMutationRate = 0.1,
    public linearGenerationFactor = 1
  ) {}

  getAvgScore(neuralNets: NeuralNetwork[]) {
    let sumOfScore = 0;

    for (let neuralNet of neuralNets) {
      sumOfScore += neuralNet.score;
    }

    this.avgScore = sumOfScore / neuralNets.length;

    // console.log("Average Score: " + this.avgScore);
    return this.avgScore;
  }

  computeNextGeneration(neuralNets: NeuralNetwork[]) {
    this.prevAvgScore = this.getAvgScore(neuralNets);
    this.avgScoreArray.push(this.prevAvgScore);
    this.prevHighScoreArray.push();

    let neuralNetsToKeep = 20;
    let numOfRandomNeuralNets = 20;
    let numOfMutatedNeuralNetsPerATB = 2;
    let numOfCrossovers = 50;
    // console.log('fittest: ' + JSON.stringify(fittest.probabilities));

    let _atbMutationRate = this.atbMutationRate;
    let _fittestMutationRate = this.fittestMutationRate;
    let _linearGenerationFactor = this.linearGenerationFactor;

    let fittestAIs: NeuralNetwork[] = this.getFittestAIs(
      neuralNets,
      neuralNetsToKeep
    );
    this.updateBestNeuralNets(fittestAIs);

    let fittest = this.getRespawnProbabilitiesAndSum(
      [...fittestAIs, ...this.allTimeBest],
      neuralNetsToKeep
    );
    fittestAIs = fittest.newAIs;

    neuralNets = [];

    // Copy previous Best NeuralNets to Next generation
    for (let i = 0; i < neuralNetsToKeep; i++) {
      let newAi = fittestAIs[i].deepCopy();
      newAi.id = "ATB-" + i;
      neuralNets.push(newAi);
    }

    //Copy allTimeBest
    for (let i = 0; i < this.allTimeBest.length; i++) {
      let newAi = this.allTimeBest[i].deepCopy();

      //Also put a slightly mutated neuralNet of that alltimebest neuralNet
      for (let j = 0; j < numOfMutatedNeuralNetsPerATB; j++) {
        let newMutatedAi = newAi.deepCopy();
        newMutatedAi.mutate(_atbMutationRate);
        newMutatedAi.id = "ATB-" + i + "-*";
        neuralNets.push(newMutatedAi);
      }
    }

    //Do Crossovers
    for (let i = 0; i < numOfCrossovers; i++) {
      let neuralNetA =
        neuralNets[Math.floor(Math.random() * (neuralNets.length - 1))];
      let neuralNetB =
        neuralNets[Math.floor(Math.random() * (neuralNets.length - 1))];

      let newAi = this.crossover(neuralNetA, neuralNetB);
      newAi.id = "crsvr-" + i;

      neuralNets.push(newAi);
    }

    //Generate some random neuralNets
    for (let i = 0; i < numOfRandomNeuralNets; i++) {
      let newAI = new NeuralNetwork(fittestAIs[0].getNumOfNeurons());
      newAI.id = "rndm-" + i;
      neuralNets.push(newAI);
    }

    //Generate and mutate new NeuralNets from
    for (let i = neuralNets.length; i < this.numOfNeuralNets; i++) {
      let probabilityIndex = this.getProbabilityIndex(
        fittest.newAIs,
        fittest.probabilities
      );
      let newAi = fittestAIs[probabilityIndex].deepCopy();
      newAi.mutate(_fittestMutationRate);
      newAi.id = "" + i;
      neuralNets.push(newAi);
    }

    this.generation++;

    return neuralNets;
  }

  getFittestAIs(neuralNets: NeuralNetwork[], topX: number) {
    let newNeuralNets: NeuralNetwork[] = [];

    for (let i = 0; i < topX; i++) {
      newNeuralNets.push(neuralNets[i]);
    }

    for (let neuralNet of neuralNets) {
      let weakestIndex = 0;
      let weakest = newNeuralNets[weakestIndex];
      for (let i = 0; i < newNeuralNets.length; i++) {
        if (
          newNeuralNets[i].score >= weakest.score &&
          newNeuralNets[i].id != weakest.id
        ) {
          weakest = newNeuralNets[i];
          weakestIndex = i;
        }
      }

      if (neuralNet.score > weakest.score && neuralNet.id != weakest.id) {
        newNeuralNets[weakestIndex] = neuralNet;
      }
    }

    return newNeuralNets;
  }

  getRespawnProbabilitiesAndSum(neuralNets: NeuralNetwork[], topX: number) {
    let probabilities: number[] = [];

    let sum = 0;
    for (let i = 0; i < topX; i++) {
      sum += neuralNets[i].score;
    }

    for (let i = 0; i < topX; i++) {
      probabilities.push(neuralNets[i].score / sum);
    }

    return {
      newAIs: neuralNets,
      probabilities: probabilities,
      sumOfScore: sum,
    };
  }

  updateBestNeuralNets(newFittestNeuralNets: NeuralNetwork[]) {
    if (this.allTimeBest.length == 0) {
      this.allTimeBest = newFittestNeuralNets;
      return;
    }

    for (let newNeuralNet of newFittestNeuralNets) {
      let weakestNeuralNet = this.allTimeBest[0];
      let weakestIndex = 0;
      // console.log("---------");

      for (let i = 0; i < this.allTimeBest.length; i++) {
        if (
          this.allTimeBest[i].score <= weakestNeuralNet.score &&
          this.allTimeBest[i].id != weakestNeuralNet.id
        ) {
          weakestNeuralNet = this.allTimeBest[i];
          weakestIndex = i;
          // console.log("found new weakest: " + weakestNeuralNet.id);
        }
      }
      // console.log("---------");

      if (this.allTimeBest[weakestIndex].score < newNeuralNet.score) {
        if (!(this.allTimeBest[weakestIndex].id == newNeuralNet.id))
          this.allTimeBest[weakestIndex] = newNeuralNet;
      }
    }

    for (let neuralNet of this.allTimeBest) {
      neuralNet.id = neuralNet.id.replace("ATB - ", "");
      neuralNet.id = "ATB - " + neuralNet.id;
    }
  }

  getProbabilityIndex(
    fittestNeuralNets: NeuralNetwork[],
    probabilities: number[]
  ) {
    let random = Math.random();
    for (let j = 0; j < fittestNeuralNets.length; j++) {
      if (random <= probabilities[j]) return j;
    }

    return fittestNeuralNets.length - 1;
  }

  setHighScore(score: number) {
    this.prevHighScore = score;
    this.prevHighScoreArray.push(score);
  }

  crossover(brainA: NeuralNetwork, brainB: NeuralNetwork) {
    return brainA.crossover(brainB);
  }
}
