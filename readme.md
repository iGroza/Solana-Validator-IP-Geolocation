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
deno run --env-file=.env --allow-env --allow-net --allow-write main.ts
```

### Required Permissions

- `--allow-env`: Allows read .env file.
- `--allow-net`: Allows network requests to fetch node and geolocation data.
- `--allow-write`: Enables writing the output CSV file.

## Output

The script generates a `solana_validators.csv` file containing the following columns:

- IP
- City
- Region
- Country
- Loc (Latitude, Longitude)
- Hosting (Hosting Organization)
- Timezone
- Pubkey (Validator Public Key)
- Activated Stake (the stake, in lamports, delegated to this vote account and active in this epoch)
- RPC (`true` if `:8899` port is open)

## Example Output

```csv=
IP,City,Region,Country,Loc,Hosting,Timezone,Pubkey,ActivatedStake,RPC
149.248.1.76,Los Angeles,California,US,"34.0614 -118.2385",AS20473 The Constant Company  LLC,America/Los_Angeles,138KHwTqKNWGLoo8fK5i8UxYtwoC5tC8o7M9rY1CDEjT,43792707979020,false
80.77.175.80,Moscow,Moscow,RU,"55.7522 37.6156",AS28917 Fiord Networks  UAB,Europe/Moscow,13cm6z7ajighVFYN1aR2hPQ3Rhp4QJenDbHGRmps9P1n,23772438369958,false
46.166.162.219,Šiauliai,Siauliai,LT,"55.9333 23.3167",AS16125 UAB Cherry Servers,Europe/Vilnius,1EWZm7aZYxfZHbyiELXtTgN1yT2vU1HF9d8DWswX2Tp,39986855237688,false
45.152.160.122,Frankfurt am Main,Hesse,DE,"50.1155 8.6842",AS44486 Oliver Horscht is trading as "SYNLINQ",Europe/Berlin,1KXvrkPXwkGF6NK1zyzVuJqbXfpenPVPP6hoiK9bsK3,277729040980867,false
45.135.201.211,Frankfurt am Main,Hesse,DE,"50.1155 8.6842",AS44486 Oliver Horscht is trading as "SYNLINQ",Europe/Berlin,1MuaDGhuN7KRqvsupUcYmq9u1YRh1pp38hu1WV2WC6S,88514991236096,false
189.1.164.11,Tokyo,Tokyo,JP,"35.6895 139.6917",AS396356 Latitude.sh,Asia/Tokyo,1NF88KpPdxVAwRSc17cEpwmfusxrrkRmR7G7u8cEva8,27173358209151,false
23.111.180.186,Tampa,Florida,US,"28.0091 -82.5034",AS29802 HIVELOCITY  Inc.,America/New_York,1so1ctTM24PdU7RLZJzJKYYVYri3gjNeCd8nmHbpdXg,26983187065045,false
216.238.89.228,El Colorado,Querétaro,MX,"20.5618 -100.2452",AS20473 The Constant Company  LLC,America/Mexico_City,1unarWPGGseFag2WfnoFv8o9P7vTPU8eHex9GinP3eY,365176060171384,false
31.128.59.215,Moscow,Moscow,RU,"55.7522 37.6156",AS215457 DCS LLC,Europe/Moscow,1znL3zFHi3znoaz6T6rnnEnRj8Ar3fohDq7ZNk37sUL,153701155247935,false
```

## License

This project is licensed under the MIT License.
