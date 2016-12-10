var express = require('express')
var request = require('request')
var cheerio = require('cheerio')
var app = express()
var exphbs = require('express-handlebars')
var path = require('path')


app.use(express.static(path.join(__dirname, '/public')))

app.use('/bsearch',express.static(path.join(__dirname, '/public')))

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


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

				var data = $(this).children("table").children("tr")

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

		request(url, function(error, response, html){
			console.log(++j-740)
			if(error){
				console.error(error)
			}
			else{
				var $ = cheerio.load(html)

				
				$('#ba-content').filter(function(){

					var data = $(this).children("table").children("tr")

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

function parseNumRatings(s){
	if (s.includes(",")){
		return parseFloat(s.replace(",",""))
	}
	return parseFloat(s)
}

function mycb(bl, callback){
	urlbase = 'https://www.beeradvocate.com'
	var j = 0
	var data
    var brewery
    var beerlink
    var $
    var i 
    var queries
    var len = bl.length
	bl.forEach( function(item){
		url = urlbase + item
		
		request(url, function(error, response, html){
			if(error){
				console.error(error)
			}
			else{
				
					
					
				db.tx(function(t){
					
					$ = cheerio.load(html)
					brewery = $('.titleBar').text().trim()
					data = $('#ba-content').find("table").children()
					queries = []
					i = 3
					while (data.eq(i).children()[0] != undefined){
						beerlink = data.eq(i).children().eq(0).children().eq(0).href
						console.log(beerlink)
						 if (!Number.isNaN(parseFloat(data.eq(i).children().eq(3).text())) && parseNumRatings(data.eq(i).children().eq(4).text()) > 2){
							queries.push(t.none("INSERT INTO calibeers (brewery, beerlink, beername, style, abv, avgrating, numratings, brorating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", 
								[brewery, beerlink, data.eq(i).children().eq(0).text(), 
								data.eq(i).children().eq(1).text(), 
								parseFloat(data.eq(i).children().eq(2).text()), 
								parseFloat(data.eq(i).children().eq(3).text()), 
								parseNumRatings(data.eq(i).children().eq(4).text()), 
								parseFloat(data.eq(i).children().eq(5).text())]))
						}
					 	i++;
					}
					return this.batch(queries)
				})
					.then(function(data){
						console.log(++j)
						//console.log(data)
						if (j==len){
							console.log(j+" was called.")
							callback()
						}
					})
					.catch(function(err){
						++j
						console.log(brewery)
						console.error("Caught this chode:", err)
					})
				
			}
			
		})
	
	})
}

function donecb(){
	console.log("done call back----------------------------------------------------------------------")
	io.emit('done scraping')

}

//code for implementing the UI portion of the app-----------------

app.get('/', function(req, res){
	//res.sendFile(__dirname + "/public/home.html")

	res.render('home', {
		beer: 'search for a beer'
	})

})

app.get('/bsearch', function(req, res){
	console.log('beer: ' + req.query['beer'])
	//res.sendFile(__dirname + "/public/home.html")
	db.any("select * from calibeers where lower(brewery) like lower(${term}) or lower(beername) like lower(${term}) order by avgrating desc", {term: '%' + req.query['beer'] + '%'})
		.then( function (data){
			console.log(data)
			res.render('home', {
				beers: data
			})
		})
		.catch( function (error){
			console.error('search error:', error)
			res.render('home', {
				beers: "Error fetching results from database"
			})
		})

	
})



//----------------------------------------------------------------

http.listen(PORT, function(){
	console.log('Got ears on', PORT)
})


exports = module.exports = app;