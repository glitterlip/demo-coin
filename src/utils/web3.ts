import Web3 from "web3";
import BuiltLotteryContract from "../../build/contracts/Lottery.json";
import BuiltCrowdFundingContract from "../../build/contracts/CrowdFunding.json";
import BuiltContractFactoryContract from "../../build/contracts/ContractFactory.json";
import {AbiItem} from "web3-utils";
import {FactoryAddress, LotteryContractAddress} from "@/consts";

const web3 = new Web3(Web3.givenProvider)
export const Web3Instance = web3

export const LotteryContract = new web3.eth.Contract(BuiltLotteryContract.abi as AbiItem[], LotteryContractAddress)
export const FactoryContract = new web3.eth.Contract(BuiltContractFactoryContract.abi as AbiItem[], FactoryAddress)

export function GetFundingContract(address: string) {
    return new web3.eth.Contract(BuiltCrowdFundingContract.abi as AbiItem[], address)
}