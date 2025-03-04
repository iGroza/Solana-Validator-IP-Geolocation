# Solana Validator IP Geolocation

This script retrieves Solana cluster node information, validates active validators, fetches their geolocation data, and saves the results as a CSV file.

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
- Location (Latitude, Longitude)
- Hosting Organization
- Timezone
- Validator Public Key

## Example Output

```csv
IP,City,Region,Country,Loc,Hosting,Timezone,Pubkey
70.34.244.25,Warsaw,Mazovia,PL,52.2298 21.0118,AS20473 The Constant Company  LLC,Europe/Warsaw,8MZFWowte8pHb6zJXxUdogUfdWRbqu7fGvaWRXtkDP7X
64.20.36.162,New York City,New York,US,40.7143 -74.0060,AS19318 Interserver  Inc,America/New_York,G35uLP74uj4eCSfMs17ePKtK1ThuH8JKebAP1T2y6CYw
23.111.240.195,Lelystad,Flevoland,NL,52.5083 5.4750,AS7979 Servers.com  Inc.,Europe/Amsterdam,5pPRHniefFjkiaArbGX3Y8NUysJmQ9tMZg3FrFGwHzSm
83.143.86.206,Oslo,Oslo,NO,59.9127 10.7461,AS34989 ServeTheWorld AS,Europe/Oslo,C8H7mCWTYDX3LJUgAH5hqmVUQAwdAyHpybTZgvfCJDaM
80.88.80.251,Brescia,Lombardy,IT,45.5356 10.2147,AS31034 Aruba S.p.A.,Europe/Rome,2zykwzzo1pd3H2oSj5j5SRLTvmpa9Nr2S2Bh8tTVd5Tq
64.185.226.194,New York City,New York,US,40.7143 -74.0060,AS18450 WebNX  Inc.,America/New_York,7nngV9xuhwHEScyKpmzx5rvAqN7YMrqBfXTr1RDrXFDR
173.231.56.138,Salt Lake City,Utah,US,40.7608 -111.8911,AS18450 WebNX  Inc.,America/Denver,AmhQFcGvH2hjkucP78rn6GMKSbstYwyFpCDVKZUwBGrG
145.40.87.78,Seoul,Seoul,KR,37.5660 126.9784,AS54825 Packet Host  Inc.,Asia/Seoul,3fnhNULLwi3BEyFUVS3qAqPjwegsNDTr3k7C8GxFbmau
208.85.17.128,Alcobendas,Madrid,ES,40.5316 -3.6475,AS20473 The Constant Company  LLC,Europe/Madrid,mLyfgvyTAuEBVyAZcqyWKJ4SnM88Tqv2hFMy68y8hmY
107.155.109.154,Tsuen Wan,Tsuen Wan,HK,22.3714 114.1133,AS29802 HIVELOCITY  Inc.,Asia/Hong_Kong,Ft7vbKXZULMQyfxCaMUzbMx55YyDbAHP8WzaWfJpty4q
```

## License

This project is licensed under the MIT License.
