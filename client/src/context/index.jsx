import React, { useContext, createContext } from 'react';

import { useAddress, useContract, useConnect, useDisconnect, metamaskWallet, useContractWrite} from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import { daysLeft } from '../utils';

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract('0x72dB2F667a9DF186039D296a3b1F1cbE2Df8f5B3');
  const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

  const address = useAddress();
  const connect = useConnect();
  const metamaskConfig = metamaskWallet();
  const disconnect = useDisconnect();


  const publishCampaign = async (form) => {
    try {
      const data = await createCampaign({
				args: [
					address, // owner
          //form.name,
					form.title, // title
					form.description, // description
					form.target,
					new Date(form.deadline).getTime(), // deadline,
					form.image,
				],
			});

      console.log("contract call success", data)
    } catch (error) {
      console.log("contract call failure", error)
    }
  }

  const getCampaigns = async () => {
    const campaigns = await contract.call('getCampaigns');

    const parsedCampaings = campaigns.map((campaign, i) => ({
      owner: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      target: ethers.utils.formatEther(campaign.target.toString()),
      deadline: campaign.deadline.toNumber(),
      amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
      image: campaign.image,
      pId: i
    }));

    return parsedCampaings;
  }

  const getUserCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

    return filteredCampaigns;
  }

  const getCompletedCampaigns = async () => {
    const allCampaigns = await getCampaigns();
  
    const filteredCampaigns = allCampaigns.filter((campaign) => daysLeft(campaign.deadline) === 0);
    return filteredCampaigns;
  }
  const getActiveCampaigns = async () => {
    const allCampaigns = await getCampaigns();
    
    const filteredCampaigns = allCampaigns.filter((campaign) => daysLeft(campaign.deadline) > 0);
    return filteredCampaigns;
  }

  const donate = async (pId, amount) => {
    const data = await contract.call('donateToCampaign', [pId], { value: ethers.utils.parseEther(amount)});

    return data;
  }

  const getDonations = async (pId) => {
    const donations = await contract.call('getDonators', [pId]);
    const numberOfDonations = donations[0].length;

    const parsedDonations = [];

    for(let i = 0; i < numberOfDonations; i++) {
      parsedDonations.push({
        donator: donations[0][i],
        donation: ethers.utils.formatEther(donations[1][i].toString())
      })
    }

    return parsedDonations;
  }

  return (
    <StateContext.Provider
      value={{ 
        address,
        contract,
        metamaskConfig,
        disconnect,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        getActiveCampaigns,
        getUserCampaigns,
        getCompletedCampaigns,
        donate,
        getDonations
      }}
    >
      {children}
    </StateContext.Provider>
  )
}

export const useStateContext = () => useContext(StateContext);