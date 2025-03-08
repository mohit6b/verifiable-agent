# verifiable-agents-zero-knowledge-proof

This section contains the code of the zero knowledge circuit which check one input is less than the other. The circuit implementation program is written in `diff.circom`

## Explanation of the Circuit

This Circom circuit implements a **LessThan** comparison using bitwise operations.

1. **Num2Bits(n)**: Converts an `n`-bit integer into its binary representation using bitwise shifts (`>>`) and stores each bit in `out[n]`. It also ensures that each output bit is either `0` or `1` (boolean constraint).  
2. **LessThan(n)**: Compares two inputs (`in[0]` and `in[1]`) by converting `(in[0] + offset - in[1])` into binary. The most significant bit (`out[n]`) determines if `in[0] < in[1]`.  
3. The main component **instantiates LessThan(100)** to compare two 100-bit numbers efficiently.  

#### Prerequisites
- You should have rust, cargo and snarkjs installed to generate proofs. Check if it is installed using
```
circom --help
```

- If not installed, then run below commands
```
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom
sudo npm i -g snarkjs
```

## Instructions to generate zero knowledge proof

### STEP 1
- To compile the circuit, run
```
circom diff.circom --r1cs --wasm --sym --c
```

- Create a new file input.json to test the circuit and input like below. 1st value is threshold and 2nd value is pize difference. Actual inputs will come through frontend.
```
{
    "in": [36189711877, 20000000000]
}
```

### STEP 2

- To calculate the witness, run
```
cd diff_js
node generate_witness.js diff.wasm input.json witness.wtns
```

### STEP 3
- We are using Groth16 proof system of zk-SNARKs. It runs in 2 phases, do powersoftau computation and generate the provingKey and verificationKey. To do that, run

#### Phase 1
```
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
```

#### Phase 2
```
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
snarkjs groth16 setup multiplier2.r1cs pot12_final.ptau multiplier2_0000.zkey
snarkjs zkey contribute multiplier2_0000.zkey multiplier2_0001.zkey --name="1st Contributor Name" -v
snarkjs zkey export verificationkey multiplier2_0001.zkey verification_key.json
```

### STEP 4
- To generate and verify the proof directly with snarkjs, run
```
snarkjs groth16 prove multiplier2_0001.zkey witness.wtns proof.json public.json
snarkjs groth16 verify verification_key.json public.json proof.json
```

#### NOTE: Step 4 can be skipped and proof generation and verification will happen on frontend

### STEP 5
- To generate the solidity verifier contract, run
```
snarkjs zkey export solidityverifier multiplier2_0001.zkey verifier.sol
```

- Now, go back to the backend folder to deploy the verifier contract and use the deployed contract address in frrontend env file.