var express = require('express')
var request = require('request')
var cheerio = require('cheerio')
var app = express()

//making socket to talk to client
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var PORT = process.env.PORT || 8081

var pgp = require('pg-promise')()



const pg = require('pg')  
const conString = 'postgres://kgudnzufnlwdsn:RR_dmEqabj1m2Y67M745Msx3WV@ec2-54-225-246-33.compute-1.amazonaws.com:5432/d6pq465ojdv75c' // make sure to match your own database's credentials

var db = pgp(conString)


function usecallback(callback){
	url = 'https://www.beeradvocate.com/place/list/?c_id=US&s_id=CA&brewery=Y'
	
	var brewlinks = []
	request(url, function(error, response, html){

		if(error){
			console.error(error)
		}
		else{
			var $ = cheerio.load(html)

			
			$('#ba-content').filter(function(){

				var data = $(this).children("table").children("tr")//.eq(3).children().eq(0).children("a").eq(0).attr().href

				var i 
				for (i = 3; i<= 41; i+=2){
					brewlinks.push(data.eq(i).children().eq(0).children("a").eq(0).attr().href)
				}

				
			})

		}
	})

	var j 
	for(j=20;j<=720;j+=20){
		url = 'https://www.beeradvocate.com/place/list/?start='+j.toString()+'&&c_id=US&s_id=CA&brewery=Y&sort=name'
		//console.log(url)

		request(url, function(error, response, html){
			console.log(++j-740)
			if(error){
				console.error(error)
			}
			else{
				var $ = cheerio.load(html)

				
				$('#ba-content').filter(function(){

					var data = $(this).children("table").children("tr")//.eq(3).children().eq(0).children("a").eq(0).attr().href

					var i 
					for (i = 3; i<= 41; i+=2){
						if(data.eq(i).children().eq(0).children("a").eq(0).attr() == undefined){
							break;
						}
						brewlinks.push(data.eq(i).children().eq(0).children("a").eq(0).attr().href)
					}

					
				})

			}
			if(j-740==36){
				callback(brewlinks, donecb)
			}
			
		})
	}
	
	
}

app.use('/scrape', function(req, res){


	res.sendFile(__dirname + "/public/index.html")
	usecallback(mycb)
	
})

io.on('connection', function(socket){
	console.log('connected')

})

function mycb(bl, callback){
	urlbase = 'https://www.beeradvocate.com'
	//console.log('wilder' + 'dfjkd')
	var k = 0
	var j = 0
	var data
    var brewery
    var $
    var i 
    var brenum
    var queries
    var len = bl.length
		bl.forEach( function(item){
				url = urlbase + item
				//console.log(url)
				request(url, function(error, response, html){
					//++j
					if(error){
						console.error(error)
					}
					else{
						
							
							
							db.tx(function(t){
								i = 3
								queries = []
								$ = cheerio.load(html)

								$('.titleBar').filter(function(){
									brewery = $(this).text().trim()
								})
								
								$('#ba-content').filter(function(){

									data = $(this).find("table").children()//.eq(3).children().eq(0).children("a").eq(0).attr().href
									//console.log(data.eq(5000).children()[0])
									while (data.eq(i).children()[0] != undefined){
									 	brenum = (data.eq(i).children().eq(4).text() == 'NaN') ? 0 : parseInt(data.eq(i).children().eq(4).text())
									 	//console.log(brenum)
										queries.push(this.none("INSERT INTO calibeers (brewery, beername, style, abv, avgrating, numratings, brorating) VALUES ($1, $2, $3, $4, $5, $6, $7)", 
											[brewery, data.eq(i).children().eq(0).text(), 
											data.eq(i).children().eq(1).text(), 
											parseFloat(data.eq(i).children().eq(2).text()), 
											parseFloat(data.eq(i).children().eq(3).text()), 
											brenum, 
											parseFloat(data.eq(i).children().eq(5).text())]))
												
											// function (err, result) {
									        
										 //        console.log(++k)
										 //        done()
										        
										 //        if (err) {
										 //          return console.error('error happened during query', err)
										 //        }
										 //     });

									 	i++;
									}
								})
								return this.batch(queries)

							})
								.then(function(data){
									console.log(++j)
									if (j==len){
										console.log(j+" was called.")
										callback()
									}
								})
								.catch(function(err){
									console.error("Caught this chode:", error)
								})
						

					}
					
				})
		

		})
}

function donecb(){
	console.log("done call back----------------------------------------------------------------------")
	io.emit('done scraping')

}

//app.listen(PORT)
http.listen(PORT, function(){
	console.log('Got ears on', PORT)
})


exports = module.exports = app;