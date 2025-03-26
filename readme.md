# Solana Validator IP Geolocation

[![Update Solana Validators CSV](https://github.com/iGroza/Solana-Validator-IP-Geolocation/actions/workflows/update-solana-validator-csv.yml/badge.svg)](https://github.com/iGroza/Solana-Validator-IP-Geolocation/actions/workflows/update-solana-validator-csv.yml)

This script retrieves Solana cluster node information, find active validators, fetches their geolocation data, and saves the results as a CSV file.

Github pages: [igroza.github.io/Solana-Validator-IP-Geolocation](https://igroza.github.io/Solana-Validator-IP-Geolocation/)

## Prerequisites

Ensure you have the following installed:

- [Deno](https://deno.land/manual/getting_started/installation)

## Installation

Clone the repository and navigate to the project folder:

```sh
git clone https://github.com/iGroza/Solana-Validator-IP-Geolocation.git
cd Solana-Validator-IP-Geolocation
```

## Environment Variables

This script requires an IP geolocation API key from [IPInfo](https://ipinfo.io/signup). Set the API key as an environment variable:

```sh
cp .env.example .env
```

## Running the Script

Execute the script using Deno:

```sh
deno task start
```

or

```sh
deno run --env-file=.env --allow-env --allow-net --allow-write ./src/main.ts
```

### Required Permissions

- `--allow-env`: Allows read .env file.
- `--allow-net`: Allows network requests to fetch node and geolocation data.
- `--allow-write`: Enables writing the output CSV file.

## Output

The script generates a `solana_validators.csv` file containing the following columns:

The output CSV file contains the following columns:

| Column | Description |
|--------|-------------|
| IP | IP address of the validator node |
| City | City where the validator is located |
| Region | Region/State where the validator is located |
| Country | Country where the validator is located |
| Loc | Geographical coordinates (Latitude, Longitude) |
| Hosting | Hosting organization or ISP |
| HostingCompanyId | Autonomous System Number (ASN) identifier for the hosting provider (e.g., AS20326) |
| Timezone | Timezone of the validator location |
| Name | Validator name |
| Website | Validator's website URL |
| IconUrl | URL to validator's icon/image |
| Details | Additional validator details |
| KeybaseUsername | Validator's Keybase username |
| ActivatedStake | Total stake (in lamports) delegated to this vote account and active in current epoch |
| Commission | Validator's commission rate (percentage) |
| NodePubkey | Public key of the validator node |
| VotePubkey | Public key of the validator's vote account |
| ProgramAccount | Public key of the validator's program account |
| ValidatorVersion | Version of the Solana software running on the validator |
| IsJito | Boolean indicating whether the validator is part of the Jito MEV network |

## Example Output

```csv=
IP,City,Region,Country,Loc,Hosting,HostingCompanyId,Timezone,Name,Website,IconUrl,Details,KeybaseUsername,ActivatedStake,Commission,NodePubkey,VotePubkey,ProgramAccount,ValidatorVersion,IsJito
212.83.42.45,Frankfurt am Main,Hesse,DE,50.1025 8.6299,23M GmbH,AS47447,Europe/Berlin,Woof Validator,https://sites.google.com/view/woof-validator/home,https://drive.google.com/file/d/1hxZzM9OCF9gtjHZ--q3Yq1rzxB_NknYH/view,Woof Woof Woof - Stake with my family,,105592816323,0,srmbYzMjbuL7eNEwSeZcDdVkoiPKPLfzBTezxjh1xUg,11aa3vsKxzxkcFX32VvCSA94bTa9EjKqUr8hfFgchjN,FXVnTD4wKuH69fuBYbKUS2bFXbRpLQBUJmfHSGwBcVGB,2.1.16,false
212.83.42.40,Frankfurt am Main,Hesse,DE,50.1025 8.6299,23M GmbH,AS47447,Europe/Berlin,BlueLotus 👩‍💻,https://www.bluelotus.one/,https://storage.googleapis.com/bluelotus/bluelotus.png, Stable Returns + MEV Bonus 🥇 Twitter : @bluelotussolana,,245238703667047,0,PAD9aPiKJGcbGxuVLbc8o4Vf65GPq3fJQ7PkHWuX6a8,1234LB7uvDC23rdCQoK8C3jNwnovUNyeKxz8wC3dghJ5,5cQnExYePUvjQRfoo3zZwFCt1CiX1bX8iT3mWXQNghET,2.1.16,true
185.187.154.151,Maastricht,Limburg,NL,50.8483 5.6889,Albanian Hosting SH.P.K.,AS48014,Europe/Amsterdam,MMGuru,https://moneymakers.guru/,,Сrypto enthusiast  noderunner,mmguru,849625392564,5,EY9dfKzLHCetix2ir7tmSMhkYrPfWSUYKn8XPKzgvdgK,12pVREJSt8d5AV4aBzGFf3QZn3qo8DWmwBQu3wQ5RAZ9,7pb3cPcnZvV7YNAkAZ8yXGHWsqht3aj1CpHc8H9Q2pQd,2.1.11,true
216.18.201.138,Salt Lake City,Utah,US,40.7608 -111.8911,WebNX  Inc.,AS18450,America/Denver,,,,,,18004139138625,5,7P5GvWEpPWjJaVbogDkpR4KhTLAoX7WB8vcSdFSPZnHT,137MRxQWHC47fFiT1F6vDsTBzEuZJb9SwTt2rm3nHLYM,,2.1.14,true
103.241.50.11,Frankfurt am Main,Hesse,DE,50.1155 8.6842,Michael Sebastian Schinzel trading as IP-Projects GmbH & Co. KG,AS48314,Europe/Berlin,goto5k,http://goto5k.me/,,validator goto5k,goto5k,25226693525498,5,BwxhmqZRmVKfDkhb3ZvNUVdrLZXQBumMrvexoYrViAoU,14YCghb1uYPreALx6arirtPAnoGghoPH2Ac6gCmNQdq7,Bk97MVQvAcZfLrTuevCiuQnGpiCAPtc89tARWawuJog6,2.1.11,true
149.255.37.218,Haarlem,North Holland,NL,52.3904 4.6573,HIVELOCITY  Inc.,AS29802,Europe/Amsterdam,1Dad 🚀 0% Fee,http://1dad.io,https://i.ibb.co/bHpzD8M/icon.png,Dad of three  stepdad to four more  full-time parent and crypto enthusiast running Solana to feed the family on a budget. Support us by staking! ❤️,1dad,269849351987164,0,FyrwfMaomErzqrFUXMjCJ7mA4u81DsiDdrzC3MJD6d4j,1Dadio3JRvpEjY6iSmXmhbGy9RiU8Nxh2GmoVbNusbE,GyB4iqrKPo29LzCvgncTjbt9QZzc7fiKhDd1JZXBXt7Z,2.1.16,true
199.247.18.165,Frankfurt am Main,Hesse,DE,50.1155 8.6842,The Constant Company  LLC,AS20473,Europe/Berlin,Piranha,https://solanapiranha.com,https://i.ibb.co/XktG1S7/Piranha.jpg,Solana Piranha validator - 0% commission - nom nom nom nom,,233592250630230,0,8mhdbYU3PxALpTfDrdTYvk5obaGxL8ATQMvCLXW9SV2L,1eufsJbqNgMProke17FLSw7JrD97fYhGggrnH9zyWnG,BCvnPp2A1pKqa9wx5BfxungNzCjabfJ6W3gBNoUA3LUM,2.1.14,true
45.152.160.122,Frankfurt am Main,Hesse,DE,50.1155 8.6842,Oliver Horscht is trading as SYNLINQ,AS44486,Europe/Berlin,1000X.sh,https://1000x.sh,,Stake with the best,1000xstake,279868590009091,0,1KXvrkPXwkGF6NK1zyzVuJqbXfpenPVPP6hoiK9bsK3,1KXz4xKV2viJCGpxqnQqdf2J45vQr5USdmtcJLTaHkm,qypVLWiBNaxR4nSSecfDCHBueTPxqekyQxuBEw2FV71,2.1.14,true
91.189.180.246,Oslo,Oslo,NO,59.9127 10.7461,ServeTheWorld AS,AS34989,Europe/Oslo,Vadym.exe,,,,,17875711107771,0,GnZB2GTH8KJKqU3L4tR42a7BnKXxvgS9rerGMAszNCp,1M5USfamd1N4i1z6UZeECrWeu2VfrxjYMBSXThu6TqB,AgmSb44WYhhj9eD95k1TwUNFNjQK5StWWqq5Ks1e4RPG,2.1.14,true

```

## License

This project is licensed under the MIT License.
