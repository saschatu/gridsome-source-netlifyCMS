# Gridsome with NetlifyCMS Template
A gridsome project with netlifyCMS configuration incuding an automatic load of content files into GraphQL based on NetlifyCMS config.yml. Goal is to avoid double maintenance of schema in gridsome and netlifyCMS.

## Details
- This project was built via `gridsome create ...` - see https://gridsome.org/docs/
- And includes the NetlifyCMS: https://www.netlifycms.org/docs/add-to-your-site/
- Furthermore a custom ID generator (reado-only, auto-generated IDs in NetlifyCMS) based on https://jozefm.dev/articles/2019/06/18/gridsome-netlify-cms-collection-relations/
- The transformer.js is the core for loading collections into gridsome using Gridsome Data Store API: https://gridsome.org/docs/data-store-api/

## Get started 

### 1) Install Gridsome CLI tool if you don't have
`npm install --global @gridsome/cli`

### 2) Exchange repository 
You have to maintain your own repository in `src\admin\netlify.yml` in line 4 (backend:repo: ... )

### 3) Start Server: 
1) `npm install`  to install dependencies
2) `gridsome develop` to start a local dev server at `http://localhost:8080` (stop: CTRL+C -> J) 

### 4) Happy coding 🎉🙌
1) Configure your data model in `static/admin/config.yml` (NetlifyCMS)
2) Run `http://localhost:8080/admin/` for entering test data
3) Have fun developing the Frontend using data via GraphQL (Browse: `http://localhost:8080/___explore`)

## Example Data
There is a small sample data model maintained for a Hackathon with Challenges and Categories. 

Note: Example data is pulle when cloning this repository and netlifyCMS does directly load into this repository the data. So each time you do change data you need to pull it to your local repo. Then restart gridsome such that it loads the new data as well. After that the new data is available in GraphQL:

Example Query: 
<pre>
  {
  allChallenge {
    edges {
      node {
        id
        title
        descriptions {
          language
          description
        }      
        hackathon {
          title
          active
          logo
          descriptions {
            language
            description
          }
        }        
        categories {
          title
          descriptions {
            language
            description
          }
        }
      }
    }
  }
}
</pre>


