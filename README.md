# radish-34

Note that, the license is under an MoU signed between EY, MSFT and ConsenSys. No parties are to disseminate or share information unless it is agreed upon by the members of this repo.

## Prerequisites

1.  Install [Docker for Mac](https://www.docker.com/docker-mac), or
    [Docker for Windows](https://www.docker.com/docker-windows)

1.  Install and start [dotdocker](https://github.com/aj-may/dotdocker)

    `dotdocker start`

## API

Endpoints are currently RESTful API endpoints. Future plans to convert them to graphQL are currently in progress. Data is randomly generated based on a simple schema for each of the following routes:

[Partner](http://radish-api.docker/partner)
[SKU](http://radish-api.docker/sku)
[RFQ](http://radish-api.docker/rfq)

## Development DB

Run `npm run seed` to generate/replace and populate the mongo db with the test data located in `./mongo-seed/collections`
