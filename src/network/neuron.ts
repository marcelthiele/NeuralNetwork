import { Connection } from './connection';
import { Layer } from './layer';

export class Neuron {
  activation = 0;
  bias = 0;

  weights: number[] = [];
  prevNeurons: Neuron[] = [];

  constructor(
    bias: number = Math.random() * 2 - 1,
    weights?: number[],
    public type = 'Type not defined',
  ) {
    this.bias = bias;
    if (weights != undefined) {
      this.weights = weights;
    }
  }

  initRandomConnectionsFromLayer(prevLayer: Layer, connections?: Connection[]) {
    this.prevNeurons = prevLayer.neurons;
    for (let neuron of prevLayer.neurons) {
      this.weights.push(Math.random() * 2 - 1);
    }
  }

  compute(activations: number[]) {
    let sum = -this.bias;

    for (let i = 0; i < activations.length; i++) {
      sum += this.weights[i] * activations[i];
    }

    this.activation = this.relu(sum);

    return this.activation;
  }

  binaryActivation(sum: number) {
    return sum < this.bias ? 0 : 1;
  }

  private sigmoid(a: number) {
    return 1 / (1 + Math.pow(Math.E, -a));
  }

  private relu(a: number) {
    return a > 0 ? a : 0;
  }

  mutate(rate: number) {
    this.bias = this.linearInterpolation(
      this.bias,
      Math.random() * 2 - 1,
      rate,
    );
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = this.linearInterpolation(
        this.weights[i],
        Math.random() * 2 - 1,
        rate,
      );
    }
  }

  deepCopy() {
    let newWeights: number[] = [...this.weights];
    return new Neuron(this.bias, newWeights, this.type);
  }

  linearInterpolation(a: number, b: number, d: number) {
    return a + (b - a) * d;
  }
}
