//      

                                                     

const pSeries = require('p-series')

const cleanProject = require('./cleanProject')

module.exports = async function cleanProjects(
  projects                ,
  options               ,
)                {
  await pSeries(projects.map(p => () => cleanProject(p, options)))
}
