const kleur = require('kleur');
const { askChain, askNodeUrl, askWallet, askDappAddress, askInputType, askInput, printOptions, askVoucherIndex, rl } = require('./display/index');
const { decode_and_relay_tx } = require('./input/index');
const fs = require('fs');
const path = require('path');
const { vouchers, execute_transaction } = require('./graphql');



// Main entrypoint of the application, Start if the command is 'mugen send'
const main = async () => {
    if (process.argv[2] === 'send') {
        await send_transaction();
    } else if (process.argv[2] === 'execute') {
        await execute_voucher();
    } else if (process.argv.includes('-v') || process.argv.includes('--version') || process.argv.includes('-version') || process.argv.includes('-Version')) {
        const packageJsonPath = path.join(__dirname, '../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Print the version
        console.log(`Version: ${packageJson.version}`);
        process.exit(0);
    } else {
        console.log('Usage: \nmugen-cli send  \nmugen-cli execute');
        process.exit(0);
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

// Function to call other methods to handle executing vouchers
const execute_voucher = async () => {
    const ora = (await import('ora')).default;
    let all_vouchers = undefined;
    try {
        all_vouchers = await vouchers();
    } catch (err) {
        console.log(kleur.red('Failed to fetch vouchers'));
        rl.close();
        return;
    }
    if (!all_vouchers || all_vouchers.length == 0) {
        console.log(kleur.blue('ALERT::No pending vouchers found!!'));
        rl.close();
        return;
    } else {
        let voucher_payload = all_vouchers.map(voucher => {
            return {
                payload: voucher,
                option: `Voucher Index: ${voucher.index} - Payload: { ${voucher.payload} }`
            }
        })

        const selected_voucher = await askVoucherIndex(voucher_payload);
        const spinner = ora('Executing voucher...').start();
        let tx_Hash = await execute_transaction(selected_voucher, 'execute_voucher');
        if (!tx_Hash) {
            spinner.fail('Failed to execute voucher');
            rl.close();
            return;
        } else {
            spinner.succeed(kleur.green("Voucher executed successfully, TxHash: " + tx_Hash));
            rl.close();
            return;
        }
    }
}





module.exports = {
    main
}