const kleur = require('kleur');
const readline = require('readline');
const { DEFAULT_CARTESI_NODE_URL, DEFAULT_WALLETS, DEFAULT_DAPP_ADDRESS, DEFAULT_SEPOLIA_URL } = require('../default');


// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

// Helper function to print out a user selection history;
function printOptions(options) {
    console.clear();
    options[0] ? console.log(kleur.green("?"), "CHAIN: ", kleur.green(`${options[0]}`)) : " ";
    options[1] ? console.log(kleur.green("?"), "NODE URL: ", kleur.green(`${options[1]}`)) : " ";
    options[2] ? console.log(kleur.green("?"), "WALLET ADDR: ", kleur.green(`${options[2]}`)) : " ";
    options[3] ? console.log(kleur.green("?"), "DAPP ADDR: ", kleur.green(`${options[3]}`)) : " ";
    options[4] ? console.log(kleur.green("?"), "INPUT TYPE: ", kleur.green(`${options[4]}`)) : " ";
    options[5] ? console.log(kleur.green("?"), "INPUT: ", kleur.green(`${options[5]}`)) : " ";
}

/**
 * Asks the user to choose a chain
 * @returns chain name
 */
const askChain = async () => {
    const chains = ['foundry', 'Sepolia'];
    const question = 'Choose a chain: ';
    return await captureKeypressNavigation(question, chains);
}

/**
 * Function to capture the node url in use
 * @returns inputed node url
 * 
 */
const askNodeUrl = async (chain) => {
    let question;

    switch (chain) {
        case 'foundry':
            question = `Enter the node URL: (${kleur.blue(`default: ${DEFAULT_CARTESI_NODE_URL}`)})`;
            return await askQuestionWithDefault(question, DEFAULT_CARTESI_NODE_URL);

        case 'Sepolia':
            question = `Enter the node URL: (${kleur.blue(`default: ${DEFAULT_SEPOLIA_URL}`)})`;
            return await askQuestionWithDefault(question, DEFAULT_SEPOLIA_URL);
        default:
            return;
    }
}

/**
 * Function to capture the wallet address a user intends to interact with
 * @returns selected wallet address
 * 
 */
const askWallet = async (chain) => {
    let question;
    switch (chain) {
        case 'foundry':
            question = 'Select wallet address: ';
            const DEFAULT_ADDRESSES = DEFAULT_WALLETS.map(w => w.WA);
            return await captureKeypressNavigation(question, DEFAULT_ADDRESSES);

        case 'Sepolia':
            // return await askAddress(DEFAULT_WALLETS);
            question = 'Select wallet interaction type:';
            const Options = [`Mnemonic ${kleur.red("(UNSAFE)")}`, `Private Key ${kleur.red("(UNSAFE)")}`]
            let selected_option = await captureKeypressNavigation(question, Options);

            if (selected_option === Options[0]) {
                return await askMnemonic();
            } else if (selected_option === Options[1]) {
                return await askPrivateKey();
            }
        default:
            return;
    }


}


const askMnemonic = async () => {
    const question = 'Enter the mnemonic: ';
    return await askQuestion(question);
}


const askPrivateKey = async () => {
    const question = 'Enter the private Key: ';
    return await askQuestion(question);
}


/**
 * Function to capture the address of the Dapp to interact with
 * @returns selected dapp address
 * 
 */
const askDappAddress = async () => {
    const question = `Enter the Dapp address: (${kleur.blue(`default: ${DEFAULT_DAPP_ADDRESS}`)})`;
    return await askQuestionWithDefault(question, DEFAULT_DAPP_ADDRESS);
}

/**
 * Function to capture the type of input to be provided to the Dapp
 * @returns selected input type
 *
 */
const askInputType = async () => {
    const input_types = ['String', 'Hex'];
    const question = 'Choose input type: ';
    return await captureKeypressNavigation(question, input_types);
}

/**
 * Function to capture the input provided by the user
 * returns typed input
 */
const askInput = async () => {
    const question = 'Enter input: ';
    return await askQuestion(question);
}


/**
 * Function to capture keypress events and navigate options
 * @param question question to display
 * @param options options to choose from
 * @returns selected option
 */
const captureKeypressNavigation = async (question, options) => {
    return new Promise((resolve) => {
        let index = 0;

        // Initial display
        // console.clear();
        console.log(kleur.green("?"), `${question}`);
        displayOptions(options, index);

        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);

        // Keypress event handler
        process.stdin.on('keypress', (str, key) => {
            if (key.name === 'up') {
                index = (index > 0) ? index - 1 : options.length - 1;
                console.clear();
                console.log(kleur.green("?"), `${question}:`);
                displayOptions(options, index);
            } else if (key.name === 'down') {
                index = (index < options.length - 1) ? index + 1 : 0;
                console.clear();
                console.log(kleur.green("?"), `${question}:`);
                displayOptions(options, index);
            } else if (key.name === 'return') {
                process.stdin.setRawMode(false);
                // process.stdin.removeAllListeners('keypress'); // Clean up keypress listeners
                console.clear();
                console.log(`\nYou selected: ${options[index]}`);
                resolve(options[index]); // Resolve the promise with the selected option
            }
        });
    });
};



// Function to display options with the current selection highlighted
const displayOptions = (options, selectedIndex) => {
    options.forEach((option, i) => {
        if (i === selectedIndex) {
            console.log(`> ${kleur.blue(`${option}`)}`); // Highlight the selected option
        } else {
            console.log(`  ${option}`);
        }
    });
};

// Function to ask a question with an optional default value
const askQuestionWithDefault = (questionText, defaultValue) => {
    return new Promise((resolve) => {
        rl.question(`${questionText} `, async (answer) => {
            resolve(answer || defaultValue); // Use default value if no input
        });
    });
};

// Function to ask a question
const askQuestion = (questionText) => {
    return new Promise((resolve) => {
        rl.question(questionText, (answer) => {
            resolve(answer);
        });
    });
};

module.exports = {
    askChain,
    askNodeUrl,
    askWallet,
    askDappAddress,
    askInputType,
    askInput,
    printOptions,
    captureKeypressNavigation,
    displayOptions,
    askQuestionWithDefault,
    askQuestion,
    rl
};