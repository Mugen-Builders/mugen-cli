const kleur = require('kleur');
const readline = require('readline');
const { ethers } = require('ethers');
const { DEFAULT_WALLETS, NONCE_URL, SEND_TRANSACTION_URL } = require('../default');
const { createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { foundry } = require('viem/chains');



/**
 * Constructor function to generate a new typed data object
 * @param app address of the application
 * @param nonce nonce of the transaction
 * @param data data to be included in the transaction
 */
function TypedData(app, nonce, data) {
    this.domain = {
        name: "Cartesi",
        version: "0.1.0",
        chainId: BigInt(parseInt(foundry.id ?? "0", 16)),
        verifyingContract: "0x0000000000000000000000000000000000000000",
    }
    this.types = {
        EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
        ],
        CartesiMessage: [
            { name: "app", type: "address" },
            { name: "nonce", type: "uint64" },
            { name: "max_gas_price", type: "uint128" },
            { name: "data", type: "bytes" },
        ],
    }
    this.primaryType = "CartesiMessage"
    this.message = {
        app,
        nonce,
        data,
        max_gas_price: BigInt(10),
    }
}

/**
 * Function to create a wallet client for a wallet user with a private key
 * @param private_key The private key of the wallet user wants to interact with
 * @returns a wallet client for the wallet user
 */
const get_wallet_client = (private_key) => {
    return createWalletClient({
        account: privateKeyToAccount(private_key),
        chain: foundry,
        transport: http(),
    })
}


/**
 * Function to get the next nonce to use for a transaction
 * @param user_address the address the user intends to use
 * @param application_address the address of the application contract
 * @returns the next nonce
 */
const fetchNonce = async (user_address, application_address) => {
    try {
        const response = await fetch(NONCE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ msg_sender: user_address, app_contract: application_address }),
        });
        // console.log('\n Request status:', response.status);
        const responseData = await response.json();
        const nextNonce = responseData.nonce;
        return nextNonce;
    } catch (error) {
        console.log('\n', kleur.red(`Failed to fetch nonce: ${error}`));
        rl.close();
        return null;
    }

};


/**
 * Function to submit a transaction to the backend
 * @param fullBody the entire signed transaction body to send
 * @returns the the response in JSON format
 */
const submitTransactionL2 = async (fullBody) => {
    try {
        const body = JSON.stringify(fullBody);
        const response = await fetch(SEND_TRANSACTION_URL, {
            method: "POST",
            body,
            headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
            console.log(kleur.red(`Failed to submit to L2: ${response.status} - ${response.statusText} - ${response.text()}`));
            rl.close();
        } else {
            return response.json();
        }
    } catch (error) {
        console.log(kleur.red(`Failed to submit Transaction: ${error}`));
        rl.close();
        return null;
    }
};


// Function to find a wallet in the DEFAULT_WALLETS array by its wallet address
function findWalletByAddress(address) {
    for (let wallet of DEFAULT_WALLETS) {
        if (wallet.WA === address) {
            return wallet;
        }
    }
    return null; // Return null if no match is found
}


/**
 * Function to get the private key for a wallet address in the DEFAULT_WALLETS array
 * @param wallet_address The wallet address to get the private key for
 * @returns The private key if found, otherwise the therminal is halted
 */
const get_private_key = (wallet_address) => {
    let wallet = findWalletByAddress(wallet_address);
    if (wallet) {
        return wallet.PK;
    } else {
        console.log('\n', kleur.red(`No private key found for wallet address: ${wallet_address}`));
        rl.close();
    }
}

/**
 * Function to send a transaction to the L2 network
 * @param {*} wallet address the user wants to send the transaction from
 * @param {*} application_address address of the application contract
 * @param {*} Input_type type of the input (hex, string)
 * @param {*} input payload the user wants to send
 * @returns the ID of the transaction
 */
const sendTransaction = async (wallet, application_address, Input_type, input) => {
    let private_key = get_private_key(wallet);
    if (!private_key) {
        rl.close();
        return;
    }
    const wallet_client = get_wallet_client(private_key);
    if (!wallet_client) {
        console.log(kleur.red("Failed to create wallet client"));
        rl.close();
        return;
    };

    let account;
    try {
        const [account1] = await wallet_client.requestAddresses();
        account = account1;
    } catch (error) {
        console.log('\n', kleur.red("Failed to request addresses, Please confirm you have an anvil node running: "));
        rl.close();
        return;
    }
    if (!account) {
        console.log(kleur.red("Failed to fetch account from client"));
        rl.close();
        return;
    }

    const nonce = await fetchNonce(account, application_address);
    if (!nonce) {
        // console.log(kleur.red("Failed to fetch nonce"));
        rl.close();
        return;
    }
    let parsed_input = await parse_input(Input_type, input);

    let typedData = new TypedData(application_address, nonce, parsed_input);
    try {
        const signature = await wallet_client.signTypedData({
            account,
            ...typedData,
        });
        const l2data = JSON.parse(
            JSON.stringify(
                {
                    typedData,
                    account,
                    signature,
                },
                (_, value) =>
                    typeof value === "bigint" ? parseInt(value.toString()) : value // return everything else unchanged
            )
        );
        const res = await submitTransactionL2(l2data);
        return res.id;

    } catch (e) {
        console.log(kleur.red(`${e}`));
        rl.close();
        return;
    }
}


/**
 * Function to parse the input based on the input type
 * @param {*} Input_type this is the type of input (String, Hex)
 * @param {*} input  this is the input value (string or hex)
 * @returns the input in hex format
 */
const parse_input = async (Input_type, input) => {
    if (Input_type === 'String') {
        return ethers.hexlify(ethers.toUtf8Bytes(input))
    } else if (Input_type === 'Hex') {
        if (input.startsWith('0x')) {
            return input;
        } else {
            return `0x${input}`;
        }
    }
}


module.exports = {
    sendTransaction
}