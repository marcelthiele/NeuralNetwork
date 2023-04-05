import { Neuron } from './neuron';

export class Layer {
  neurons: Neuron[] = [];

  constructor(numOfNeurons: number, public type="Type not defined") {
    for (let i = 0; i < numOfNeurons; i++) {
      this.neurons.push(new Neuron(undefined, undefined, type));
    }
  }

  setValues(data: number[]){
    for(let i = 0; i < data.length; i++){
        this.neurons[i].activation = data[i];
    }
  }

  compute(prevActivations: number[]) {
    for(let i = 0; i < this.neurons.length; i++){
        this.neurons[i].compute(prevActivations);
    }
  }

  getActivations(){
    let ret = [];
    for(let neuron of this.neurons){
        ret.push(neuron.activation);
    }

    return ret;
  }

  mutate(rate:number){
    for(let neuron of this.neurons){      
        neuron.mutate(rate);
    }
  }

  serialize(){
    let hash = 0;

    for(let neuron of this.neurons){
      for(let i = 0; i < neuron.weights.length; i++){
        hash = ((hash << 5) - hash)+neuron.weights[i];
        hash |= 0;
      }
    }
    console.log("hash: " + hash);
    return hash;
  }
}
