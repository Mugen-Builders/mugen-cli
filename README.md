# Mugen-CLI

Mugen-CLI is a Command Line Interface (CLI) tool designed to facilitate sending EIP712 transactions to the Brunodo/Piao sequencer backend. These transactions are picked up by a Cartesi dApp running locally, which then processes the inputs and executes them accordingly. The tool serves as a temporary solution while awaiting the official implementation of this functionality in the Cartesi CLI.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Dependencies](#dependencies)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)
- [License](#license)

## Introduction

Mugen-CLI allows users to send EIP712 transactions directly from the terminal to the Brunodo/Piao sequencer backend. This is particularly useful for interacting with a locally running Cartesi dApp which integrate avail, celestia or espreso, these dApps listens for these transactions to perform specific tasks.

This tool is designed as a temporary solution until the official Cartesi CLI supports the functionality.

## Features

- Simple CLI interface for sending EIP712 transactions
- Interactive prompts to guide users through the transaction submission process
- Automated nonce tracking and retrieval

## Installation

### Prerequisites

Ensure you have the following installed before using Mugen-CLI:

- Node.js (version 18 or higher)
- NPM or Yarn package manager
- Brunodo

### Installing Mugen-CLI

1. Clone the repository:

   ```bash
   git clone https://github.com/Mugen-Builders/mugen-cli
   ```

2. Navigate to the project directory:

   ```bash
   cd mugen-cli
   ```

3. Install the necessary dependencies:

   ```bash
   npm install
   ```

   or if you're using Yarn:

   ```bash
   yarn install
   ```

4. Link the CLI tool globally:

   ```bash
   npm link
   ```

   or if you're using Yarn:

   ```bash
   yarn link
   ```

## Usage

To start using Mugen-CLI, follow these steps:

1. Run the following command to start the CLI tool:

   ```bash
   mugen-cli send
   ```

2. You will be prompted to select or enter certain transaction details via an interactive interface. You can navigate through the options using the arrow keys or by pressing `Enter` for default selections.

3. Once you've provided the necessary inputs, confirm them by pressing `Enter`. The input will then be sent to the Brunodo/Piao sequencer backend for processing by the Cartesi dApp.

## Configuration

Currently, there are no external configuration options required for running Mugen-CLI. The necessary prompts are provided during runtime.

## Troubleshooting

Issue: CLI command fails with an error.

Solution: Check that all dependencies are installed properly and that you are using the correct version of Node.js. Most importantly confirm that you have brunodo installed and running locally.

## Contributors

- [Mugen Builders](https://github.com/Mugen-Builders)
- [Idogwu Chinonso](https://github.com/Nonnyjoe)

Feel free to contribute by submitting pull requests or reporting issues.

## License

This project is licensed under the Apache-2.0 license. See the LICENSE file for details.
