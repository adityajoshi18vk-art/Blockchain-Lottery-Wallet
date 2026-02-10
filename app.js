// Contract Configuration
const CONTRACT_ADDRESS = '0xcd082cc9ea4e02c9113376c9d5992c176b9f3101';
const CONTRACT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
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
const enterLotteryBtn = document.getElementById('enterLotteryBtn');
const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');
const pickWinnerBtn = document.getElementById('pickWinnerBtn');
const walletAddress = document.getElementById('walletAddress');
const contractBalance = document.getElementById('contractBalance');
const statusMessage = document.getElementById('statusMessage');

// Global variables
let provider = null;
let signer = null;
let contract = null;
let currentAccount = null;

// Event Listeners
connectWalletBtn.addEventListener('click', connectWallet);
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
        alert('Please run a local server:\n1. Open terminal in project folder\n2. Run: npx -y serve .\n3. Open http://localhost:3000');
        return;
    }

    if (!isMetaMaskInstalled()) {
        updateStatus('Please install MetaMask!', 'error');
        alert('MetaMask is not installed. Please install it from metamask.io');
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
            alert('Wrong network! Please switch to Sepolia testnet in MetaMask.\n\nCurrent chain ID: ' + network.chainId + '\nRequired: 11155111 (Sepolia)');

            // Try to switch to Sepolia
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }] // 11155111 in hex
                });
                // Reload after switch
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

        // Check if this is manager account
        const managerAddress = await contract.manager();
        const isManager = managerAddress.toLowerCase() === currentAccount.toLowerCase();

        // If manager hasn't connected yet, only allow manager
        if (!sessionStorage.getItem('managerConnected') && !isManager) {
            updateStatus('Please connect with Manager account first!', 'error');
            showNotification('⚠️ Please switch to the Manager account (Account 1) in and try again.\n\nInitial setup requires the Manager to connect first.');

            // Reset connection
            provider = null;
            signer = null;
            contract = null;
            currentAccount = null;
            connectWalletBtn.textContent = 'Connect Wallet';
            walletAddress.textContent = 'Not Connected';
            return;
        }

        // Mark that manager has connected at least once
        if (isManager) {
            sessionStorage.setItem('managerConnected', 'true');
        }

        walletAddress.textContent = shortenAddress(currentAccount);
        connectWalletBtn.textContent = 'Connected';

        updateStatus('Wallet connected on Sepolia!', 'success');

        // Auto refresh balance
        await refreshBalance();

        // Check if manager and show/hide Pick Winner button
        await checkIfManager();

    } catch (error) {
        console.error('Connection failed:', error);
        if (error.code === 4001) {
            updateStatus('Connection rejected by user', 'warning');
        } else {
            updateStatus('Connection failed: ' + error.message, 'error');
        }
    }
}

// Check if current account is manager
async function checkIfManager() {
    // Hide button by default
    pickWinnerBtn.style.display = 'none';

    try {
        const managerAddress = await contract.manager();
        console.log('Manager address from contract:', managerAddress);
        console.log('Current account:', currentAccount);

        const isManager = managerAddress.toLowerCase() === currentAccount.toLowerCase();
        console.log('Is manager:', isManager);

        if (isManager) {
            pickWinnerBtn.style.display = 'block';
            console.log('Pick Winner button shown - you are the manager');
        } else {
            pickWinnerBtn.style.display = 'none';
            console.log('Pick Winner button hidden - you are not the manager');
        }
    } catch (error) {
        console.error('Error checking manager:', error);
    }
}

// Shorten address for display
function shortenAddress(address) {
    return address.slice(0, 6) + '...' + address.slice(-4);
}

// Enter Lottery - Send ETH to contract
async function enterLottery() {
    if (!signer || !contract) {
        updateStatus('Please connect wallet first', 'warning');
        return;
    }

    try {
        updateStatus('Entering lottery...');

        // Send exactly 0.002 ETH (2 finney) to trigger receive()
        const tx = await signer.sendTransaction({
            to: CONTRACT_ADDRESS,
            value: 2000000000000000n, // Exactly 0.002 ETH in wei
            gasLimit: 100000n // Explicit gas limit
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
            updateStatus('Transaction reverted - check contract requirements', 'error');
        } else {
            updateStatus('Failed to enter: ' + (error.reason || error.message), 'error');
        }
    }
}

// Refresh Balance - Use provider.getBalance since contract.getBalance requires manager
async function refreshBalance() {
    if (!provider) {
        updateStatus('Please connect wallet first', 'warning');
        return;
    }

    try {
        updateStatus('Refreshing balance...');

        // Use provider to get contract balance (works for everyone)
        const balance = await provider.getBalance(CONTRACT_ADDRESS);
        contractBalance.textContent = ethers.formatEther(balance) + ' SEP ETH';

        updateStatus('Balance updated', 'success');

    } catch (error) {
        console.error('Refresh balance failed:', error);
        updateStatus('Failed to get balance', 'error');
    }
}

// Pick Winner - Manager only
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

        await refreshBalance();

    } catch (error) {
        console.error('Pick winner failed:', error);
        if (error.code === 4001) {
            updateStatus('Transaction rejected by user', 'warning');
        } else if (error.message.includes('participants')) {
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

            // Reconnect contract with new signer
            signer = await provider.getSigner();
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            updateStatus('Account changed', 'success');
            await checkIfManager();
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
