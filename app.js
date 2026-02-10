// Contract Configuration — UPDATE THIS after deploying the new contract
const CONTRACT_ADDRESS = '0xcd082cc9ea4e02c9113376c9d5992c176b9f3101';
const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "startLottery",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "lotteryActive",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "manager",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "participants",
        "outputs": [{ "internalType": "address payable", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "random",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "selectWinner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
];

// DOM Elements
const connectWalletBtn = document.getElementById('connectWalletBtn');
const startLotteryBtn = document.getElementById('startLotteryBtn');
const enterLotteryBtn = document.getElementById('enterLotteryBtn');
const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');
const pickWinnerBtn = document.getElementById('pickWinnerBtn');
const walletAddress = document.getElementById('walletAddress');
const contractBalance = document.getElementById('contractBalance');
const statusMessage = document.getElementById('statusMessage');
const startSection = document.getElementById('startSection');
const enterSection = document.getElementById('enterSection');
const managerSection = document.getElementById('managerSection');
const lotteryStatus = document.getElementById('lotteryStatus');
const lotteryStatusText = document.getElementById('lotteryStatusText');

// Global variables
let provider = null;
let signer = null;
let contract = null;
let currentAccount = null;

// Event Listeners
connectWalletBtn.addEventListener('click', connectWallet);
startLotteryBtn.addEventListener('click', startLottery);
enterLotteryBtn.addEventListener('click', enterLottery);
refreshBalanceBtn.addEventListener('click', refreshBalance);
pickWinnerBtn.addEventListener('click', pickWinner);

// Check if MetaMask is installed
function isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
}

// Check if running on file:// protocol
function isFileProtocol() {
    return window.location.protocol === 'file:';
}

// Connect Wallet Function
async function connectWallet() {
    if (isFileProtocol()) {
        updateStatus('Cannot connect from file:// - use a local server', 'error');
        showNotification('Please run a local server:\n1. Open terminal in project folder\n2. Run: npx -y serve .\n3. Open http://localhost:3000');
        return;
    }

    if (!isMetaMaskInstalled()) {
        updateStatus('Please install MetaMask!', 'error');
        showNotification('MetaMask is not installed.\n\nPlease install it from metamask.io');
        return;
    }

    try {
        updateStatus('Connecting wallet...');

        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        provider = new ethers.BrowserProvider(window.ethereum);

        // Check network - must be Sepolia (chain ID 11155111)
        const network = await provider.getNetwork();
        console.log('Connected to network:', network.name, 'Chain ID:', network.chainId);

        if (network.chainId !== 11155111n) {
            updateStatus('Please switch to Sepolia network!', 'error');
            showNotification('Wrong network!\n\nPlease switch to Sepolia testnet in MetaMask.\n\nCurrent chain ID: ' + network.chainId + '\nRequired: 11155111 (Sepolia)');

            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }]
                });
                window.location.reload();
            } catch (switchError) {
                console.error('Failed to switch network:', switchError);
            }
            return;
        }

        signer = await provider.getSigner();
        currentAccount = accounts[0];
        console.log('Connected account:', currentAccount);

        // Create contract instance
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        walletAddress.textContent = shortenAddress(currentAccount);
        connectWalletBtn.textContent = 'Connected';

        updateStatus('Wallet connected on Sepolia!', 'success');

        // Update the entire UI based on contract state
        await updateUI();

    } catch (error) {
        console.error('Connection failed:', error);
        if (error.code === 4001) {
            updateStatus('Connection rejected by user', 'warning');
        } else {
            updateStatus('Connection failed: ' + error.message, 'error');
        }
    }
}

// Update UI based on contract state
async function updateUI() {
    if (!contract) return;

    try {
        const isActive = await contract.lotteryActive();
        const managerAddress = await contract.manager();
        const isManager = managerAddress.toLowerCase() === currentAccount.toLowerCase();
        const isNoManager = managerAddress === '0x0000000000000000000000000000000000000000';

        console.log('Lottery active:', isActive, 'Manager:', managerAddress, 'Is manager:', isManager);

        if (isActive) {
            // Lottery is active
            lotteryStatus.className = 'lottery-status active';
            lotteryStatusText.textContent = 'Lottery Active — Manager: ' + shortenAddress(managerAddress);

            startSection.style.display = 'none';
            enterSection.style.display = 'block';

            if (isManager) {
                managerSection.style.display = 'block';
            } else {
                managerSection.style.display = 'none';
            }
        } else {
            // Lottery is inactive
            lotteryStatus.className = 'lottery-status inactive';
            lotteryStatusText.textContent = 'Lottery Inactive — Start a new round!';

            startSection.style.display = 'block';
            enterSection.style.display = 'none';
            managerSection.style.display = 'none';
        }

        await refreshBalance();

    } catch (error) {
        console.error('Error updating UI:', error);
    }
}

// Shorten address for display
function shortenAddress(address) {
    return address.slice(0, 6) + '...' + address.slice(-4);
}

// Start Lottery — anyone can call, they become manager
async function startLottery() {
    if (!signer || !contract) {
        updateStatus('Please connect wallet first', 'warning');
        return;
    }

    try {
        updateStatus('Starting lottery...');

        const tx = await contract.startLottery();
        updateStatus('Transaction sent, waiting for confirmation...');
        await tx.wait();

        updateStatus('🚀 Lottery started! You are the manager.', 'success');
        showNotification('🚀 Lottery Started!\n\nYou are now the manager.\nOther users can now enter by sending 1 SEP ETH.\n\nPick a winner when at least 3 participants have joined.');

        await updateUI();

    } catch (error) {
        console.error('Start lottery failed:', error);
        if (error.code === 4001) {
            updateStatus('Transaction rejected by user', 'warning');
        } else if (error.message.includes('already active')) {
            updateStatus('Lottery is already active!', 'error');
        } else {
            updateStatus('Failed: ' + (error.reason || error.message), 'error');
        }
    }
}

// Enter Lottery - Send 1 ETH to contract
async function enterLottery() {
    if (!signer || !contract) {
        updateStatus('Please connect wallet first', 'warning');
        return;
    }

    try {
        updateStatus('Entering lottery...');

        // Send exactly 1 ETH to trigger receive()
        const tx = await signer.sendTransaction({
            to: CONTRACT_ADDRESS,
            value: ethers.parseEther('1'),
            gasLimit: 100000n
        });

        updateStatus('Transaction sent, waiting for confirmation...');
        await tx.wait();

        updateStatus('Successfully entered the lottery!', 'success');
        await refreshBalance();

    } catch (error) {
        console.error('Enter lottery failed:', error);
        console.log('Error details:', JSON.stringify(error, null, 2));
        if (error.code === 4001) {
            updateStatus('Transaction rejected by user', 'warning');
        } else if (error.code === 'CALL_EXCEPTION') {
            updateStatus('Transaction reverted — is the lottery active?', 'error');
        } else {
            updateStatus('Failed to enter: ' + (error.reason || error.message), 'error');
        }
    }
}

// Refresh Balance
async function refreshBalance() {
    if (!provider) {
        updateStatus('Please connect wallet first', 'warning');
        return;
    }

    try {
        const balance = await provider.getBalance(CONTRACT_ADDRESS);
        contractBalance.textContent = ethers.formatEther(balance) + ' SEP ETH';
    } catch (error) {
        console.error('Refresh balance failed:', error);
        updateStatus('Failed to get balance', 'error');
    }
}

// Pick Winner — Manager only (Stop & Declare Winner)
async function pickWinner() {
    if (!signer || !contract) {
        updateStatus('Please connect wallet first', 'warning');
        return;
    }

    try {
        updateStatus('Collecting participants...');

        // 1. Get all participant addresses before picking winner
        let participants = [];
        try {
            for (let i = 0; i < 100; i++) {
                const addr = await contract.participants(i);
                participants.push(addr);
            }
        } catch (e) {
            // Reached end of participants array
        }

        // Get unique addresses
        const uniqueParticipants = [...new Set(participants.map(a => a.toLowerCase()))];
        console.log('Participants:', uniqueParticipants);

        // 2. Save balances before picking winner
        const balancesBefore = {};
        for (const addr of uniqueParticipants) {
            balancesBefore[addr] = await provider.getBalance(addr);
        }

        // 3. Get contract balance (prize pool)
        const prizeWei = await provider.getBalance(CONTRACT_ADDRESS);
        const prizeAmount = ethers.formatEther(prizeWei);

        updateStatus('Selecting winner...');

        // 4. Call selectWinner
        const tx = await contract.selectWinner();
        updateStatus('Transaction sent, waiting for confirmation...');
        const receipt = await tx.wait();

        // 5. Compare balances to find the winner
        let winnerAddress = null;
        for (const addr of uniqueParticipants) {
            const balanceAfter = await provider.getBalance(addr);
            const diff = balanceAfter - balancesBefore[addr];
            if (diff > 0n) {
                winnerAddress = addr;
                break;
            }
        }

        const txHash = receipt.hash;

        if (winnerAddress) {
            updateStatus(`🎉 Winner: ${shortenAddress(winnerAddress)} won ${prizeAmount} SEP ETH!`, 'success');
            showNotification(`🎉 Winner Selected!\n\nWinner: ${shortenAddress(winnerAddress)}\n\nPrize: ${prizeAmount} SEP ETH\n\nTx: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);
        } else {
            updateStatus(`🎉 Winner selected! Prize: ${prizeAmount} SEP ETH sent.`, 'success');
            showNotification(`🎉 Winner Selected!\n\nPrize: ${prizeAmount} SEP ETH\n\nTx: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);
        }

        // Lottery ended — update UI to show Start button again
        await updateUI();

    } catch (error) {
        console.error('Pick winner failed:', error);
        if (error.code === 4001) {
            updateStatus('Transaction rejected by user', 'warning');
        } else if (error.message.includes('participants') || error.message.includes('3')) {
            updateStatus('Need at least 3 participants to pick winner', 'error');
        } else {
            updateStatus('Failed: ' + (error.reason || error.message), 'error');
        }
    }
}

// Update status message with optional state
function updateStatus(message, state = '') {
    statusMessage.textContent = message;
    statusMessage.className = state;
}

// Listen for account changes
if (window.ethereum) {
    window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
            walletAddress.textContent = 'Not Connected';
            connectWalletBtn.textContent = 'Connect Wallet';
            signer = null;
            contract = null;
            currentAccount = null;
            updateStatus('Wallet disconnected', 'warning');
        } else {
            currentAccount = accounts[0];
            walletAddress.textContent = shortenAddress(currentAccount);

            signer = await provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            updateStatus('Account changed', 'success');
            await updateUI();
        }
    });

    window.ethereum.on('chainChanged', () => {
        window.location.reload();
    });
}

// Show styled notification
function showNotification(message) {
    const overlay = document.getElementById('notificationOverlay');
    const text = document.getElementById('notificationText');
    text.textContent = message;
    overlay.classList.remove('hidden');
}

// Close notification
function closeNotification() {
    const overlay = document.getElementById('notificationOverlay');
    overlay.classList.add('hidden');
}
