Basically, the cost of our transaction = effective gas price \* gasUsed

## Gas used during a successful transaction:

1. These intrinsic gas are consumed first:

![Intrinsic Gas](./img/Pasted%20Graphic.png)

Some notes:

- For our transactions to update via the three update functions, T_A is an empty set

- There is no G_txcreate in our updating transactions

- Therefore, we only care about G_txdatazero and G_txdatanonzero.

2. There are two cases that can happen here:
   a. The to address is null, then this is contract creation, the code to be executed is the creation bytecode.
   b. The to address is not null, then it is a message call, the code to be executed is the runtime bytecode of this to field.

3. Then the gas cost is spent on executing every opcode or precompiled contracts after this.

4. Along the way, there is going to be a refund for any empty of storage or self-destruct of an account. This refund is reimbursed at the end of the execution of the transaction and capped at 1/5 of the gas spent for the whole transaction.

According to our implementation up till now, there seems to be only 2 concerns:

1. The non-zero-ness or not of the bytes in our call data

   Let’s assume all bytes are non-zero during our gas estimation for the worst case

2. The SSTORE dynamic charging.

   I think we can assume for most of the cases, the gas cost is going to be switching a non-zero slot to a non-zero slot.
   Therefore, during our estimation, let's take the transition from non-zero to non-zero of the values.

In conclusion, during our estimation, let's consider the case for switching from non-zero data to non-zero data, and then pushing the value to where all calldata bytes of the transaction are non-zero.

Reference:

https://ethereum.github.io/yellowpaper/paper.pdf

https://github.com/wolflo/evm-opcodes/tree/main

https://github.com/ethereum/go-ethereum/blob/a196f3e8a22b6ad22ced5c2e3baf32bc3ebd4ec9/core/state_transition.go#L355

## Regarding effective gas price

The type of transaction we are sending is of EIP-1559, hence

Effective gas price = min (max_fee_per_gas, block_base_fee + max_priority_fee_per_gas)(
[reference](https://github.com/ethereum/EIPs/blob/2e05704d86356ff23eb5eb7136e5d9fc7eac0545/EIPS/eip-1559.md?plain=1#L224)
)

max_fee_per_gas, block_base_fee and max_priority_fee_per_gas seems all depend on the market condition. One reference for such market that we can take is Ethereum mainnet.

Link: https://etherscan.io/chart/gasprice

A calculation of the average gas price for the last 6 months indicates a value of 40 gWei.
Therefore, let's put the gas price for our one tx = 125 % \* 40 = 50

testcommit