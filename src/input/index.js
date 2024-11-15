const kleur = require('kleur');
const readline = require('readline');
const { ethers } = require('ethers');
const { DEFAULT_WALLETS, NONCE_URL, SEND_TRANSACTION_URL } = require('../default');
const { createWalletClient, http, createPublicClient } = require('viem');
const { privateKeyToAccount, mnemonicToAccount } = require('viem/accounts');
const { foundry } = require('viem/chains');
const { rl } = require('../display/index');


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
    try {
        return createWalletClient({
            account: privateKeyToAccount(private_key),
            chain: foundry,
            transport: http(),
        })
    } catch (err) {
        console.error(kleur.red('\nError creating wallet client: ') + kleur.yellow(err.message));
        return null;
    }
}


/**
 * Function to create a Public client for a  user
 * @returns a public client for foundry
 */
const get_public_client = () => {
    try {
        return createPublicClient({
            chain: foundry,
            transport: http(),
        })
    } catch (err) {
        console.error(kleur.red('\nError creating public client: ') + kleur.yellow(err.message));
        return null;
    }
}


/**
 * Function to create a wallet client for a wallet user with a users Mnemonic
 * @param mnemonic The mnemonics for the wallet user wants to interact with
 * @returns a wallet client for the wallet user
 */
const wallet_client_froom_mnemonic = async (mnemonic) => {
    try {
        return createWalletClient({
            account: mnemonicToAccount(mnemonic),
            chain: foundry,
            transport: http(),
        })
    } catch (err) {
        console.error(kleur.red('\nError creating wallet client from mnemonic: ') + kleur.yellow(err.message));
        return null;
    }
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

        const responseData = await response.json();
        const nextNonce = responseData.nonce;
        return nextNonce;
    } catch (error) {
        console.log('\n', kleur.red(`Failed to fetch nonce: ${error} `));
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
 * Entrypoint function for submiting a transaction signe using an inputed private key
 * @param {*} private_key wallet private key which the user wants to send the transaction from
 * @param {*} application_address address of the application contract
 * @param {*} Input_type type of the input (hex, string)
 * @param {*} input payload the user wants to send
 * @returns The result from the send transaction function whcih is the transaction Id.
 */
const transact_via_private_key = async (private_key, application_address, Input_type, input) => {
    const wallet_client = get_wallet_client(private_key);
    if (!wallet_client) {
        console.log(kleur.red("Failed to create wallet client"));
        rl.close();
        return;
    };
    const [account] = await wallet_client.requestAddresses();

    return await sendTransaction(wallet_client, account, application_address, Input_type, input)
}

/**
 * Entrypoint function for submiting a transaction signe using an inputed mnemonic key
 * @param {*} mnemonic Mnemonics for teh wallet which the user wants to send the transaction from
 * @param {*} application_address address of the application contract
 * @param {*} Input_type type of the input (hex, string)
 * @param {*} input payload the user wants to send
 * @returns The result from the send transaction function whcih is the transaction Id.
 */
const transact_via_mnemonic = async (mnemonic, application_address, Input_type, input) => {
    const wallet_client = await wallet_client_froom_mnemonic(mnemonic);
    if (!wallet_client) {
        console.log(kleur.red("Failed to create wallet client"));
        rl.close();
        return;
    };
    const [account] = await wallet_client.requestAddresses();

    return await sendTransaction(wallet_client, account, application_address, Input_type, input)
}


/**
 * Entrypoint function for submiting a transaction signe using any of the default foundry wallets
 * @param {*} wallet_address wallet address which the user wants to send the transaction from
 * @param {*} application_address address of the application contract
 * @param {*} Input_type type of the input (hex, string)
 * @param {*} input payload the user wants to send
 * @returns The result from the send transaction function whcih is the transaction Id.
 */
const transact_via_local = async (wallet_address, application_address, Input_type, input) => {
    let private_key = get_private_key(wallet_address);
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

    return await sendTransaction(wallet_client, wallet_address, application_address, Input_type, input)
}

/**
 * Function to send a transaction to the L2 network
 * @param {*} wallet_clien wallet private key wrapped in a viem client which the user wants to send the transaction from
 * @param {*} application_address address of the application contract
 * @param {*} Input_type type of the input (hex, string)
 * @param {*} input payload the user wants to send
 * @returns the ID of the transaction
 */
const sendTransaction = async (wallet_client, account, application_address, Input_type, input) => {

    const nonce = await fetchNonce(account, application_address);
    if (nonce >= 0) {
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
    } else {
        console.log(kleur.red("\nFailed to fetch nonce"));
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

/**
 * Function to receive input request, then decode the type of wallet a users is requesting 
 * with and call the appropriate entry point functions
 * @param {*} wallet wallet implementation choice (mnemonics,  private key, local wallets) which the user wants to send the transaction from
 * @param {*} application_address address of the application contract
 * @param {*} Input_type type of the input (hex, string)
 * @param {*} input payload the user wants to send
 * @param {*} chain network choice where a transaction should be sent to (local host or  sepolia)
 * @returns The result from the called entry point function whcih is the transaction Id.
 */
const decode_and_relay_tx = async (wallet, application_address, Input_type, input, chain) => {
    switch (chain) {
        case 'foundry':
            return await transact_via_local(wallet, application_address, Input_type, input);
        case 'Sepolia':
            let mnemonic_check = wallet.split(" ");
            if (mnemonic_check.length > 5) {
                return await transact_via_mnemonic(wallet, application_address, Input_type, input);
            } else {
                return await transact_via_private_key(wallet, application_address, Input_type, input);
            }
        default:
            console.log(kleur.red("Invalid chain, please use 'foundry' or 'Sepolia'"));
            rl.close();
            return;
    }
}



module.exports = {
    decode_and_relay_tx,
    get_wallet_client,
    get_public_client
}