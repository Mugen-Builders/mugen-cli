const kleur = require('kleur');
const { askChain, askNodeUrl, askWallet, askDappAddress, askInputType, askInput, printOptions, rl } = require('./display/index');
const { decode_and_relay_tx } = require('./input/index');




// Main entrypoint of the application, Start if the command is 'mugen send'
const main = async () => {
    if (process.argv[2] === 'send') {
        await send_transaction();
    } else {
        console.log('Usage: mugen-cli send');
    }
}


// Function to calls other methods to display questions and handle user input.
const send_transaction = async () => {
    const ora = (await import('ora')).default;
    const chain = await askChain();
    printOptions([chain]);
    const node_url = await askNodeUrl(chain);
    printOptions([chain, node_url]);
    const wallet = await askWallet(chain);
    printOptions([chain, node_url, wallet]);
    const application_address = await askDappAddress();
    printOptions([chain, node_url, wallet, application_address]);
    const Input_type = await askInputType();
    printOptions([chain, node_url, wallet, application_address, Input_type]);
    const input = await askInput();
    printOptions([chain, node_url, wallet, application_address, Input_type, input]);
    const spinner = ora('Signing and relaying EIP712 input...').start();
    const transaction_id = await decode_and_relay_tx(wallet, application_address, Input_type, input, chain);
    if (transaction_id) {
        spinner.succeed(kleur.green(`Transaction submitted with ID: ${transaction_id}`));
        rl.close();
    } else {
        rl.close();
        spinner.fail('Failed to submit transaction');
        return;
    }
}


module.exports = {
    main
}