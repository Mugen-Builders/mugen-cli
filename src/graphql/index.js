
const { GRAPHQL_URL, DEFAULT_WALLETS, DEFAULT_DAPP_ADDRESS, INPUT_BOX_ADDRESS } = require("../default");
const { Application__factory } = require("@cartesi/rollups/dist/src/types/factories/contracts/dapp/Application__factory");
const { Outputs__factory } = require("@cartesi/rollups/dist/src/types/factories/contracts/common/Outputs__factory");
const { InputBox__factory } = require("@cartesi/rollups/dist/src/types/factories/contracts/inputs/InputBox__factory");
const { createPublicClient, createWalletClient, decodeAbiParameters, decodeFunctionData, formatEther, fromHex, http, parseAbiParameters, size, slice } = require('viem');
const kleur = require('kleur');
const { get_wallet_client, get_public_client } = require('../input/index');
const { rl } = require("../display");
const { } = require('../default');





const VoucherDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "voucher" }, "variableDefinitions": [{ "kind": "VariableDefinition", "variable": { "kind": "Variable", "name": { "kind": "Name", "value": "outputIndex" } }, "type": { "kind": "NonNullType", "type": { "kind": "NamedType", "name": { "kind": "Name", "value": "Int" } } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "voucher" }, "arguments": [{ "kind": "Argument", "name": { "kind": "Name", "value": "outputIndex" }, "value": { "kind": "Variable", "name": { "kind": "Name", "value": "outputIndex" } } }], "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "index" } }, { "kind": "Field", "name": { "kind": "Name", "value": "input" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "index" } }, { "kind": "Field", "name": { "kind": "Name", "value": "payload" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "destination" } }, { "kind": "Field", "name": { "kind": "Name", "value": "executed" } }, { "kind": "Field", "name": { "kind": "Name", "value": "value" } }, { "kind": "Field", "name": { "kind": "Name", "value": "payload" } }, { "kind": "Field", "name": { "kind": "Name", "value": "proof" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "outputIndex" } }, { "kind": "Field", "name": { "kind": "Name", "value": "outputHashesSiblings" } }] } }] } }] } }] };
const VouchersDocument = { "kind": "Document", "definitions": [{ "kind": "OperationDefinition", "operation": "query", "name": { "kind": "Name", "value": "vouchers" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "vouchers" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "edges" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "node" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "index" } }, { "kind": "Field", "name": { "kind": "Name", "value": "input" }, "selectionSet": { "kind": "SelectionSet", "selections": [{ "kind": "Field", "name": { "kind": "Name", "value": "id" } }, { "kind": "Field", "name": { "kind": "Name", "value": "index" } }, { "kind": "Field", "name": { "kind": "Name", "value": "payload" } }] } }, { "kind": "Field", "name": { "kind": "Name", "value": "destination" } }, { "kind": "Field", "name": { "kind": "Name", "value": "value" } }, { "kind": "Field", "name": { "kind": "Name", "value": "payload" } }] } }] } }] } }] } }] };
const url = GRAPHQL_URL;

// Function to get the complete details of a voucher including the proof
const getVoucher = async (
    outputIndex
) => {
    const request = (await import("graphql-request")).default;
    const data = await request(url, VoucherDocument, { outputIndex });
    return data?.voucher ? data.voucher : undefined;
};

// Function to get the details of a voucher without the proofs
const getVouchers = async () => {
    const request = (await import("graphql-request")).default;
    try {
        const data = await request(url, VouchersDocument);
        if (data?.vouchers?.edges) {
            let vouchers_array = data.vouchers.edges.map((e) => e.node);
            return vouchers_array;
        } else {
            return [];
        }
    } catch (err) {
        if (err.response.status === 404) {
            console.log(kleur.red('GraphQl server is not active.'));
            rl.close();
            return [];
        } else {
            console.error("Error fetching vouchers:");
            rl.close();
            return [];
        }
    }
};

// function to handle, decode, restructure and return vouchers
const vouchers = async () => {
    const vouchers = await getVouchers();
    // console.log(kleur.green("Fetched vouchers:" + JSON.stringify(vouchers)));
    // console.log(vouchers.length);
    if (!vouchers) return [];

    let decoded_vouchers = [];

    for (let voucher of vouchers) {

        // console.log(voucher);

        let payload = voucher.payload;

        if (payload) {
            // console.log(payload);
            const { functionName, args } = decodeFunctionData({ abi: Outputs__factory.abi, data: payload });
            // console.log(functionName + args);

            const selector = args[2] && size(args[2]) > 4 ? slice(args[2], 0, 4) : "";

            // console.log(kleur.blue(`Selector: ${selector}`));

            const data = args[2] && size(args[2]) > 4 ? slice(args[2], 4, payload.length) : "0x";
            // console.log(kleur.green(`data: ${data}`));

            switch (selector.toLowerCase()) {
                case '0xa9059cbb': {
                    // erc20 transfer;
                    const decode = decodeAbiParameters(
                        parseAbiParameters('address receiver, uint256 amount'),
                        data
                    );
                    payload = `Erc20 Transfer - Amount: ${decode[1]} - Address: ${decode[0]}`;
                    break;
                }
                case '0x42842e0e': {
                    //erc721 safe transfer;
                    const decode = decodeAbiParameters(
                        parseAbiParameters('address sender, address receiver, uint256 id'),
                        data
                    );
                    payload = `Erc721 Transfer - Id: ${decode[2]} - Address: ${decode[1]}`;
                    break;
                }
                case '0xf242432a': {
                    //erc155 single safe transfer;
                    const decode = decodeAbiParameters(
                        parseAbiParameters('address sender, address receiver, uint256 id, uint256 amount'),
                        data
                    );
                    payload = `Erc1155 Single Transfer - Id: ${decode[2]} Amount: ${decode[3]} - Address: ${decode[1]}`;
                    break;
                }
                case '0x2eb2c2d6': {
                    //erc155 Batch safe transfer;
                    const decode = decodeAbiParameters(
                        parseAbiParameters('address sender, address receiver, uint256[] ids, uint256[] amounts'),
                        data
                    );
                    payload = `Erc1155 Batch Transfer - Ids: ${decode[2]} Amounts: ${decode[3]} - Address: ${decode[1]}`;
                    break;
                }
                case '0xd0def521': {
                    //erc721 mint;
                    const decode = decodeAbiParameters(
                        parseAbiParameters('address receiver, string url'),
                        data
                    );
                    payload = `Mint Erc721 - String: ${decode[1]} - Address: ${decode[0]}`;
                    break;
                }
                case '0x755edd17': {
                    //erc721 mintTo;
                    const decode = decodeAbiParameters(
                        parseAbiParameters('address receiver'),
                        data
                    );
                    payload = `Mint Erc721 - Address: ${decode[0]}`;
                    break;
                }
                case '0xa1448194': {
                    //erc20 safeMint;
                    const decode = decodeAbiParameters(
                        parseAbiParameters('address to, uint256 tokenId'),
                        data
                    );
                    payload = `Safe Mint Erc20 TokenId: ${(decode[1]).toString()} to Address: ${decode[0]}`;
                    break;
                }

                case '0x6a627842': {
                    //erc721 mint;
                    const decode = decodeAbiParameters(
                        parseAbiParameters('address receiver'),
                        data
                    );
                    payload = `Mint Erc721 - Address: ${decode[0]}`;
                    break;
                }
                default: {
                    // payload = args[0] + " (hex)";
                    payload = "Unknown execution to destination: " + args[0] + " with value: " + args[1];
                    break;
                }
            }

            // console.log("final payload is", payload);
            let voucher_data = await getVoucher(voucher.index);

            if (voucher_data.proof.outputHashesSiblings.length == 0) {
                await execute_transaction('warp_time', 'warp_time');
                voucher_data = await getVoucher(voucher.index);
            }

            decoded_vouchers.push({
                index: voucher.index,
                payload: payload,
                paylod_hex: voucher_data.payload,
                destination: `${voucher ? voucher.destination : ""}`,
                value: voucher.value,
                input: (voucher && voucher.input?.id) ? { id: voucher.input.id, payload: voucher_data.input.payload } : undefined,
                status: voucher.executed ? voucher.executed : 'false',
                proof: voucher_data.proof ? voucher_data.proof : undefined,
            })

            decoded_vouchers.sort((a, b) => {
                return b.index - a.index;
            })
        }
    }

    // console.log(decoded_vouchers);
    return decoded_vouchers;
}


/**
 * Function to send 11 dummy data's to the inputbox so as to simulate processing of 10 blocks 
 * and proof generation.
 * @param {*} wallet_client a wallet client used to send transaction to the anvil node
 */
const warp_time = async (wallet_client) => {
    let address = await wallet_client.requestAddresses();
    // console.log(address[0]);
    for (let i = 0; i < 11; i++) {
        try {
            const tx_hash = await wallet_client.writeContract({
                account: address[0],
                address: INPUT_BOX_ADDRESS,
                abi: InputBox__factory.abi,
                functionName: "addInput",
                args: [
                    DEFAULT_DAPP_ADDRESS,
                    "0x77617270"
                ]
            })
            await get_public_client().waitForTransactionReceipt({ hash: tx_hash });
        } catch (err) {
            console.error(`Error warping time: ${err.message} to generate proof`);
            break;
        }
    }
    console.log(kleur.yellow("LOG:: WARPED TIME BY 11 BLOCKS TO GENERATE PROOF"));
}




/**
 * Function to execute a voucher by sending the generated proof to the dapp contract
 * @param {*} wallet_client a wallet client used to send transaction to the anvil node
 * @param {*} payload the generated payload to be sent to the dapp contract
 * @param {*} outputIndex The index of the proof in the bundle of processed voucher
 * @param {*} outputHashesSiblings the array of the generated hashes (proofs) to be sent to the dapp contract
 * @returns the hash of the transaction that sent this data to the dapp contract
 */
const execute_voucher = async (payload, outputIndex, outputHashesSiblings, wallet_client) => {
    // console.log(outputIndex);
    // console.log(outputHashesSiblings);
    // console.log(payload);

    let address = await wallet_client.requestAddresses();
    const tx_hash = await wallet_client.writeContract({
        account: address[0],
        address: DEFAULT_DAPP_ADDRESS,
        abi: Application__factory.abi,
        functionName: "executeOutput",
        args: [
            payload,
            { outputIndex, outputHashesSiblings }
        ]
    })
    await get_public_client().waitForTransactionReceipt({ hash: tx_hash });
    return tx_hash;
}


const execute_transaction = async (payload, tx_type) => {
    let pk = DEFAULT_WALLETS[0].PK;
    const walletClient = get_wallet_client(pk);


    switch (tx_type) {
        case 'execute_voucher': {
            const txHash = await execute_voucher(payload.paylod_hex, payload.proof.outputIndex, payload.proof.outputHashesSiblings, walletClient);
            return txHash;
        }

        case 'warp_time': {
            await warp_time(walletClient);
            break;
        }
    }
}

module.exports = { vouchers, execute_transaction };