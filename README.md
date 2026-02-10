# 🎰 Lottery DApp

A decentralized lottery application built on Ethereum (Sepolia Testnet) where users can enter a lottery by sending ETH and a manager can pick a random winner.

![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

---

## 📌 About

This is a blockchain-based lottery system where:

- **Participants** can enter the lottery by sending **0.002 SEP ETH**
- **Manager** (contract deployer) can pick a random winner once there are enough participants
- The **entire prize pool** is transferred to the winner
- Built with a clean, responsive frontend and integrated with **MetaMask**

---

## ✨ Features

- 🔗 **MetaMask Wallet Integration** — Connect your wallet seamlessly
- 🎲 **Enter Lottery** — Send 0.002 SEP ETH to participate
- 💰 **Live Contract Balance** — View the current prize pool
- 🏆 **Winner Detection** — Automatically identifies and displays the winner's address
- 🔒 **Manager Access Control** — Only the contract deployer can pick the winner
- 📱 **Responsive Design** — Works on desktop and mobile
- 🔔 **Styled Notifications** — Beautiful in-app notifications instead of browser alerts
- 🌐 **Network Validation** — Ensures users are on Sepolia testnet

---

## 🛠️ Tech Stack

| Layer       | Technology                    |
| ----------- | ----------------------------- |
| Frontend    | HTML5, CSS3, Vanilla JavaScript |
| Blockchain  | Solidity, Ethereum (Sepolia)  |
| Library     | Ethers.js v6                  |
| Wallet      | MetaMask                      |
| Deployment  | GitHub Pages / Vercel         |

---

## 🚀 Getting Started

### Prerequisites

- [MetaMask](https://metamask.io/) browser extension installed
- Sepolia testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Node.js installed (for local server)

### Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Lottery-DApp.git
   cd Lottery-DApp
   ```

2. **Start a local server**
   ```bash
   npx serve .
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

4. **Connect MetaMask** — Make sure you're on **Sepolia testnet**

---

## 📂 Project Structure

```
Lottery-DApp/
├── index.html      # Main HTML page
├── style.css       # Styles and responsive design
├── app.js          # DApp logic & smart contract interaction
└── README.md       # Project documentation
```

---

## 📜 Smart Contract

The lottery smart contract is deployed on **Sepolia Testnet**.

| Property          | Value                                        |
| ----------------- | -------------------------------------------- |
| Network           | Sepolia Testnet                              |
| Entry Fee         | 0.002 SEP ETH                                |
| Min. Participants | 3                                            |
| Winner Selection  | Pseudo-random (based on block data)          |

### Contract Functions

| Function         | Access    | Description                              |
| ---------------- | --------- | ---------------------------------------- |
| `receive()`      | Public    | Enter lottery by sending 0.002 ETH       |
| `getBalance()`   | View      | Get contract balance                     |
| `manager()`      | View      | Get manager address                      |
| `participants(i)`| View      | Get participant at index                 |
| `random()`       | View      | Get random number                        |
| `selectWinner()` | Manager   | Pick a random winner & transfer funds    |

---

## 🔄 How It Works

```
1. Manager deploys the smart contract → becomes the manager
2. Participants connect wallet → send 0.002 ETH to enter
3. Once enough participants join → Manager clicks "Pick Winner"
4. Smart contract selects a random participant as winner
5. Entire prize pool is transferred to the winner 🎉
```

---

## ⚠️ Important Notes

- **Always connect with the Manager account first** when using the DApp for the first time
- Minimum **3 participants** are required before a winner can be picked
- If you **redeploy the contract**, update the `CONTRACT_ADDRESS` in `app.js` (line 2)
- This DApp uses **Sepolia testnet** — no real ETH is involved

---

## 📸 Screenshots

> _Add screenshots of your DApp here after deployment_

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.

---

<p align="center">
  Made with ❤️ on Ethereum
</p>
