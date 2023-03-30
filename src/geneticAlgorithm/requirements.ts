import { NeuralNetwork } from "../network/neuralnetwork";

export class GeneticRequirement {
    constructor(
      public id: string,
      public score: number,
      public brain: NeuralNetwork
    ) {}
  }