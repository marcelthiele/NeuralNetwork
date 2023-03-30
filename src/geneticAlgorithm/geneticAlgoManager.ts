import { NeuralNetwork } from "../network/neuralnetwork";
import { GeneticRequirement } from "./requirements";

export class GeneticAlgoFactory {
  generation = 1;
  prevAvgScore = 0;
  avgScore = 0;
  agentsAlive = 0;
  prevHighScore = 0;

  prevHighScoreArray: number[] = [0];
  avgScoreArray: number[] = [0];

  allTimeBest: GeneticRequirement[] = [];

  constructor(private numOfAgents = 200) {}

  getAvgScore(agents: GeneticRequirement[]) {
    let sumOfScore = 0;

    for (let agent of agents) {
      sumOfScore += agent.score;
    }

    this.avgScore = sumOfScore / agents.length;

    // console.log("Average Score: " + this.avgScore);
    return this.avgScore;
  }

  computeNextGeneration(agents: GeneticRequirement[]) {
    this.prevAvgScore = this.getAvgScore(agents);
    this.avgScoreArray.push(this.prevAvgScore);
    this.prevHighScoreArray.push();

    let agentsToKeep = 20;
    let numOfRandomAgents = 20;
    let numOfMutatedAgentsPerATB = 2;
    let numOfCrossovers = 50;
    // console.log('fittest: ' + JSON.stringify(fittest.probabilities));

    let fittestAgents: GeneticRequirement[] = this.getFittestAgents(agents, agentsToKeep);
    this.updateBestAgents(fittestAgents);

    let fittest = this.getRespawnProbabilitiesAndSum(
      [...fittestAgents, ...this.allTimeBest],
      agentsToKeep
    );
    fittestAgents = fittest.newAgents;

    agents = [];

    // Copy previous Best Agents to Next generation
    for (let i = 0; i < agentsToKeep; i++) {
      let newAi = fittestAgents[i].brain.deepCopy();
      let newAgent = new GeneticRequirement("f" + i, 0, newAi);
      agents.push(newAgent);
    }

    //Copy allTimeBest
    for (let i = 0; i < this.allTimeBest.length; i++) {
      let newAi = this.allTimeBest[i].brain.deepCopy();

      //Also put a slightly mutated agent of that alltimebest agent
      for (let j = 0; j < numOfMutatedAgentsPerATB; j++) {
        let newAgent = new GeneticRequirement(this.allTimeBest[i].id + "*", 0, newAi.deepCopy());
        newAgent.brain.mutate(
          (0.05 * (j / numOfMutatedAgentsPerATB)) / ((1 / 1.5) * this.generation)
        );
        agents.push(newAgent);
      }
    }

    //Do Crossovers
    for (let i = 0; i < numOfCrossovers; i++) {
      let agentA = agents[Math.floor(Math.random() * (agents.length - 1))];
      let agentB = agents[Math.floor(Math.random() * (agents.length - 1))];

      let newAi = this.crossover(agentA, agentB);
      let newAgent = new GeneticRequirement("crossover - " + i, 0, newAi);

      agents.push(newAgent);
    }

    //Generate some random agents
    for (let i = 0; i < numOfRandomAgents; i++) {
      let newAgent = new GeneticRequirement("Rndm - " + i, 0, new NeuralNetwork(agents[0].brain.getNumOfNeurons()));
      agents.push(newAgent);
    }

    //Generate and mutate new Agents from
    for (let i = agents.length; i < this.numOfAgents; i++) {
      let probabilityIndex = this.getProbabilityIndex(
        fittest.newAgents,
        fittest.probabilities
      );
      let newAi = fittestAgents[probabilityIndex].brain.deepCopy();
      let newAgent = new GeneticRequirement(""+i,0,newAi);
      newAgent.brain.mutate(
        (0.5 * (i / this.numOfAgents)) / (0.2 * this.generation)
      );
      agents.push(newAgent);
    }

    this.generation++;

    return agents;
  }

  getFittestAgents(agents: GeneticRequirement[], topX: number) {
    let newAgents: GeneticRequirement[] = [];

    for (let i = 0; i < topX; i++) {
      newAgents.push(agents[i]);
    }

    for (let agent of agents) {
      let weakestIndex = 0;
      let weakest = newAgents[weakestIndex];
      for (let i = 0; i < newAgents.length; i++) {
        if (
          newAgents[i].score >= weakest.score &&
          newAgents[i].id != weakest.id
        ) {
          weakest = newAgents[i];
          weakestIndex = i;
        }
      }

      if (agent.score > weakest.score && agent.id != weakest.id) {
        newAgents[weakestIndex] = agent;
      }
    }

    return newAgents;
  }

  getRespawnProbabilitiesAndSum(agents: GeneticRequirement[], topX: number) {
    let probabilities: number[] = [];

    let sum = 0;
    for (let i = 0; i < topX; i++) {
      sum += agents[i].score;
    }

    for (let i = 0; i < topX; i++) {
      probabilities.push(agents[i].score / sum);
    }

    return {
      newAgents: agents,
      probabilities: probabilities,
      sumOfScore: sum,
    };
  }

  updateBestAgents(newFittestAgents: GeneticRequirement[]) {
    if (this.allTimeBest.length == 0) {
      this.allTimeBest = newFittestAgents;
      return;
    }

    for (let newAgent of newFittestAgents) {
      let weakestAgent = this.allTimeBest[0];
      let weakestIndex = 0;
      // console.log("---------");

      for (let i = 0; i < this.allTimeBest.length; i++) {
        if (
          this.allTimeBest[i].score <= weakestAgent.score &&
          this.allTimeBest[i].id != weakestAgent.id
        ) {
          weakestAgent = this.allTimeBest[i];
          weakestIndex = i;
          // console.log("found new weakest: " + weakestAgent.id);
        }
      }
      // console.log("---------");

      if (this.allTimeBest[weakestIndex].score < newAgent.score) {
        if (!(this.allTimeBest[weakestIndex].id == newAgent.id))
          this.allTimeBest[weakestIndex] = newAgent;
      }
    }

    for (let agent of this.allTimeBest) {
      agent.id = agent.id.replace("ATB - ", "");
      agent.id = "ATB - " + agent.id;
    }
  }

  getProbabilityIndex(fittestAgents: GeneticRequirement[], probabilities: number[]) {
    let random = Math.random();
    for (let j = 0; j < fittestAgents.length; j++) {
      if (random <= probabilities[j]) return j;
    }

    return fittestAgents.length - 1;
  }

  setHighScore(score: number) {
    this.prevHighScore = score;
    this.prevHighScoreArray.push(score);
  }

  crossover(agentA: GeneticRequirement, agentB: GeneticRequirement) {
    return agentA.brain.crossover(agentB.brain);
  }

}
