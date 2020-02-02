# Gridsome with NetlifyCMS Template
A gridsome project with netlifyCMS configuration incuding an automatic load of content files into GraphQL based on NetlifyCMS config.yml. Goal is to avoid double maintenance of schema in gridsome and netlifyCMS.

## Details
This project was built via `gridsome create ...` - see https://gridsome.org/docs/
And includes the NetlifyCMS: https://www.netlifycms.org/docs/add-to-your-site/
Furthermore a custom ID generator (reado-only, auto-generated IDs in NetlifyCMS) based on https://jozefm.dev/articles/2019/06/18/gridsome-netlify-cms-collection-relations/
The transformer.js is the core for loading collections into gridsome using Gridsome Data Store API: https://gridsome.org/docs/data-store-api/

## Get started 

### 1) Install Gridsome CLI tool if you don't have
npm install --global @gridsome/cli

### 2) Start Server: 
1) `npm install`  to install dependencies
2) `gridsome develop` to start a local dev server at `http://localhost:8080` (stop: CTRL+C -> J) 

### 3) Happy coding 🎉🙌
1) Configure your data model in `static/admin/config.yml` (NetlifyCMS)
2) Run `http://localhost:8080/admin/` for entering test data
3) Have fun developing the Frontend using data via GraphQL (Browse: `http://localhost:8080/___explore`)


