var request = require('request');
var cheerio = require('cheerio');
var Regex = require("regex");
var async = require("async");
var xml2json = require("xml2json");

function fetchTransactions(url, callback)
{
	request(url, function(error, response, html)
	{
		console.log(html);
		if(!error)
		{
			result = JSON.parse(xml2json.toJson(html));
			owner["transactions"].push(result);
			console.log(result);
		}
	});
}

function getCompanyTransactions(company_id, start, end, url_list, count, owner, callback)
{
	transaction_url = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=" + company_id + "&type=4%25&dateb=&owner=include&start=" + start + "&count=100";
	request(transaction_url, function(error, response, html)
	{
		if(!error)
		{
			var $ = cheerio.load(html);
			document_list = $("#documentsbutton");
			console.log(document_list.length);
			if (document_list.length == 0 || count <= url_list.length)
			{
				async.forEach(url_list, function(url, callback3) 
				{ 
				request(url, function(error, response, html)
				{
					console.log(url);
					var $ = cheerio.load(html);
					a_list = $("a");
					var xml_url = null;
					var json_data = null;
					for(var a in a_list)
					{
						try{
						var a_text = $(a_list[a]).text();
						if (a_text.indexOf(".xml")!=-1)
						{
							href = $(a_list[a]).attr("href");
							xml_url = "https://www.sec.gov" + href;
							console.log("Got links : " + url);
							break;
						}
						}catch(e)
						{
						}
							
					}
					console.log(xml_url);
					request(xml_url, function(error, response, html)
					{
						if(!error)
						{
							console.log("Got response from XML 123=> " + xml_url);
							
							var json_data = JSON.parse(xml2json.toJson(html));
							console.log(json_data.length);
							try{
							json_data["ownershipDocument"]["issuer"]["issuerTradingSymbol"] = json_data["ownershipDocument"]["issuer"]["issuerTradingSymbol"].replace(/\W/g, ' ')
							}catch(e)
							{
							}
							owner["transactions"].push(json_data);
							
							
							
						}
						
						callback3();
					});
					
				});
			}, function(err) {
				callback(owner);
				console.log("Done");
			});
				
			}
			else
			{
				for(var i = 0; i<document_list.length; i++)
				{
					var href = ($(document_list[i]).attr("href"));
					url_list.push("https://www.sec.gov" + href);
					if(url_list.length >= count)
						break;
					
				}
				getCompanyTransactions(company_id, end, end+100,  url_list, count, owner, callback);
			}
			
		}
		else
		{
			console.log("Error");
		}
	});
}


function fetchTransactionURL(url, callback)
{
	request(url, function(error, response, html)
	{
		if(!error)
		{
			var $ = cheerio.load(html);
			a_list = $("a");
			for(var a in a_list)
			{
				var a_text = $(a_list[a]).text();
				if (a_text.indexOf(".xml")!=-1)
				{
					href = $(a_list[a]).attr("href");
					var url = "https://www.sec.gov" + href;
					console.log("Got links : " + url);
					break;
				}
				
			}
		}
		else
		{
			console.log("Error");
		}
	});
}

function addTransactions(owner, json)
{
	console.log("Adding in transactions");
	if(json != null)
		owner["transactions"].push(json);
}

function stripHtml(html)
{
	return html.replace(/<\/?[^>]+(>|$)/g, "");
}

function get_company_info(company_id, start, count, is_fetch_transactions, res)
{
	//var url = 'https://www.sec.gov/cgi-bin/own-disp?action=getowner&CIK=' + company_id;
	var url = 'https://www.sec.gov/cgi-bin/own-disp?action=getissuer&CIK=' + company_id + '&type=&dateb=&owner=include&start=0';
	console.log("Parsing URL " + url);
	var promises = [];
	var xml_list = [];
	request(url, function(error, response, html)
	{
		var company_info = {};
        if(!error){
			var $ = cheerio.load(html);
			var company = { "name" : "" , "cik": "", "stateLocation" : "", "sicNumber" : "", "sicName" : "", "stateOfInc" : "", "fiscalYearEnd" : "", "businessAddress" : "", "mailingAddress" : ""};
			
			var company_name = "";
			var cik = "";
			var stateLocation = "";
			var sicNumber = "";
			var sicName = "";
			var stateOfInc = "";
			var mailingAddress = "";
			var businessAddress = "";
			var fiscalYearEnd = "";
			
			try{
				company_name = $("b").html().split("(")[0].trim();
			}catch(e)
			{
				res.send("Invalid Company");
				return;
			}
			console.log(company_name);
			//return;
			sic_container = $("td:contains(SIC)").html();
			normalized_html = "";
			try{
			normalized_html = sic_container.replace(/(\r\n|\n|\r)/gm,"");
			}catch(e)
			{
			}
			try{
				sicNumber = stripHtml(normalized_html.match(/SIC.*?<a.*?>(.*?)<\/a>/)[1]);
			}catch(e)
			{
			}
			
			try{
				sicName = stripHtml(normalized_html.match(/SIC.*?<a.*?<\/a>(.*?)<br>/)[1].replace("-", ""));
			}catch(e)
			{
			}
			
			try{
			fiscalYearEnd = stripHtml(normalized_html.match(/Fiscal Year End:(.*?)<\/td>/)[1].trim());
			}catch(e)
			{
			}
			
			try{
			stateOfInc = stripHtml(normalized_html.match(/State of Inc.:(.*?)<\/b>/)[1].trim());
			}catch(e)
			{
			}
			
			try{
				businessAddress = stripHtml(normalized_html.match(/Business Address(.*?)<\/td>/)[1].trim());
			}catch(e)
			{
			}
			
			try{
				mailingAddress = stripHtml(normalized_html.match(/Mailing Address(.*?)<\/td>/)[1].trim());
			}catch(e)
			{
			}
			/*
			console.log(businessAddress_html);
			console.log(mailingAddress_html);
			console.log(state_of_inc);
			console.log(sic);
			console.log(sic_name);
			console.log(fiscal_year);
			*/
			//return;
			
			box = $("td:contains(State location)").html();
			var state_location = "";
			try{
			box = $("td:contains(State location)").html();
			var result_state = box.match(/State location: <a .*?>(.*?)<\/a>/);
			var state_location = result_state[1];
			console.log("State Location : " + result_state[1]);
			
			}catch(e)
			{ 
				box = html;
			}
			stateLocation = state_location;
			var owner_list_data = [];
			box = box.replace(/(\r\n|\n|\r)/gm,"");
			var type_of_owner = "";
			try
			{
				owner_type = box.match(/Type of Owner<\/a>.*?<td><a .*?>(.*?)<\/td><\/tr>/)[1];
				owner_list = ($($("table")[6]).find("tr"));
				for(var i=0; i<owner_list.length; i++)
				{
					if(i == 0)
						continue;
					var col_list = $(owner_list[i]).find("td");
					var name = $(col_list[0]).find("a").text();
					var owner_cik = $(col_list[1]).find("a").text();
					var transaction_date = $(col_list[2]).text();
					var typeOfOwner = $(col_list[3]).text();
					owner_list_data.push({"name" : name, "cik" : owner_cik, "transactionDate" : transaction_date, "typeofOwner" : typeOfOwner});
					
				}
			}catch(e)
			{
			}
			
			company["name"] = company_name;
			company["cik"] = company_id;
			company["stateLocation"] = stateLocation;
			company["sicNumber"] = sicNumber;
			company["sicName"] = sicName;
			company["stateOfInc"] = stateOfInc;
			company["mailingAddress"] = mailingAddress;
			company["businessAddress"] = businessAddress;
			company["fiscalYearEnd"] = fiscalYearEnd;
			
			company_info["company"] = company;
			company_info["owners"] = owner_list_data;
			company_info["transactions"] = [];
			console.log(company_info);
			if(!is_fetch_transactions)
			{
				res(company_info);
				return;
			}
			//#return;
			transaction_url = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=" + company_id + "&type=4%25&dateb=&owner=include&start=100&count=100";
			transaction_list = [transaction_url];
			//start = 0;
			end = 100;
			async.forEach(transaction_list, function(url, callback2)
			{
				getCompanyTransactions(company_id, start, end, [], count, company_info, callback2);
				
				
			}, function(company_info)
			{
				console.log("Don");
				console.log(company_info);
				company_info["transactions"].sort(function(a, b) { 
					date1 = new Date(a["ownershipDocument"]["periodOfReport"]);
					date2 = new Date(b["ownershipDocument"]["periodOfReport"]);
					if (date1.getTime() > date2.getTime()) {
						return -1;
					}
					else 
						return 1;
					
				})
				res.send(company_info);
				
			});
			
			
			
        }
    });
}

	


function get_owner_info(company_id, start, count, res)
{
	var url = 'https://www.sec.gov/cgi-bin/own-disp?action=getowner&CIK=' + company_id;
	console.log("Parsing URL " + url);
	var promises = [];
	var xml_list = [];
	request(url, function(error, response, html)
	{

        if(!error){
			var $ = cheerio.load(html);
			var owner = { "name" : "" , "cik": "", "stateLocation" : "", "address" : "", "typeOfOwner" : ""}
			var owner_name = "";
			var address_state = "";
			try{
            owner_name = $("b").html().split("(")[0].trim();
			}catch(e)
			{
				res.send("Invalid Company");
				return;
			}
			owner["name"] = owner_name;
			owner["cik"] = company_id;
			
			box = $("td:contains(State location)").html();
			var state_location = "";
			try{
			box = $("td:contains(State location)").html();
			var result_state = box.match(/State location: <a .*?>(.*?)<\/a>/);
			var state_location = result_state[1];
			console.log("State Location : " + result_state[1]);
			
			}catch(e)
			{ 
				box = html;
			}
			try{
			address_box = $("table:contains(Address)").html();
			address_state = address_box.split("Address</b><br>")[1].split("</table>")[0].replace("<br>", " ").trim();
			address_state = address_state.replace(/(\r\n|\n|\r)/gm," ").replace("<tr>", "").replace("<br>","").replace("</td>", "").replace("</tbody>", "").replace("</tr>","");
			
			//console.log(address_state);	
			}catch(e)
			{
				
			}
			box = box.replace(/(\r\n|\n|\r)/gm,"");
			var type_of_owner = "";
			try{
			owner_type = box.match(/Type of Owner<\/a>.*?<td><a .*?>(.*?)<\/td><\/tr>/)[1];
			owner_count = ($($("table")[6]).find("tr").length);
			if (owner_count > 3)
			{
				type_of_owner = "multiple";
			}
			else
			{
				array_owner = owner_type.split("<td>");
				console.log("Length ====> " , array_owner.length);
				type_of_owner = array_owner[array_owner.length - 1];
			}
			}catch(e)
			{
				
			}
			
			box = box.replace(/(\r\n|\n|\r)/gm,"");
			owner_list_data = [];
			var type_of_owner = "";
			try
			{
				owner_type = box.match(/Type of Owner<\/a>.*?<td><a .*?>(.*?)<\/td><\/tr>/)[1];
				owner_list = ($($("table")[6]).find("tr"));
				for(var i=0; i<owner_list.length; i++)
				{
					if(i == 0)
						continue;
					var col_list = $(owner_list[i]).find("td");
					var name = $(col_list[0]).find("a").text();
					var owner_cik = $(col_list[1]).find("a").text();
					var transaction_date = $(col_list[2]).text();
					var typeOfOwner = $(col_list[3]).text();
					owner_list_data.push({"name" : name, "cik" : owner_cik, "transactionDate" : transaction_date, "typeofOwner" : typeOfOwner});
					
				}
			}catch(e)
			{
			}
			
			
			owner["typeOfOwner"] = type_of_owner;
			owner["address"] = stripHtml(address_state).trim();
			owner["stateLocation"] = state_location;
			owner["owners"] = owner_list_data;
			owner["transactions"] = [];
			//count = 10;
			transaction_url = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=" + company_id + "&type=4%25&dateb=&owner=include&start=100&count=100";
			transaction_list = [transaction_url];
			//start = 0;
			end = 100;
			async.forEach(transaction_list, function(url, callback2)
			{
				getCompanyTransactions(company_id, start, end, [], count, owner, callback2);
				
				
			}, function(owner)
			{
				console.log("Don");
				console.log(owner);
				owner["transactions"].sort(function(a, b) { 
					date1 = new Date(a["ownershipDocument"]["periodOfReport"]);
					date2 = new Date(b["ownershipDocument"]["periodOfReport"]);
					if (date1.getTime() > date2.getTime()) {
						return -1;
					}
					else 
						return 1;
					
				})
				res.send(owner);
				
			});
			
			
			
        }
    });
}



function fetch_form_4(url_list, callback)
{
	var recent_data = [];
	async.forEach(url_list, function(url, callback3) 
	{ 
				company_info = url.split("/")[6];
				get_company_info(company_info, 0, 0, false, function(data)
				{
					console.log(data);
					
					request(url, function(error, response, html)
					{
						console.log(url);
						var $ = cheerio.load(html);
						a_list = $("a");
						var xml_url = null;
						var json_data = null;
						for(var a in a_list)
						{
							try{
							var a_text = $(a_list[a]).text();
							if (a_text.indexOf(".xml")!=-1)
							{
								href = $(a_list[a]).attr("href");
								xml_url = "https://www.sec.gov" + href;
								console.log("Got links : " + url);
								break;
							}
							}catch(e)
							{
							}
								
						}
						console.log(xml_url);
						request(xml_url, function(error, response, html)
						{
							console.log("Got response from XML 123 => " + xml_url);
							if(!error)
							{
								var json_data = JSON.parse(xml2json.toJson(html));
								try{
									json_data["ownershipDocument"]["issuer"]["issuerTradingSymbol"] = json_data["ownershipDocument"]["issuer"]["issuerTradingSymbol"].replace(/\W/g, ' ')
								}catch(e)
								{
								}
								data["transactions"] = json_data;
								recent_data.push(data);
								
								
							}
							
							callback3();
						});
					
					});
			})	
	}, function()			
	{
		console.log(recent_data);
		callback(recent_data);
	});
				
}

function get_cik(symbol, res)
{
	url = "https://www.sec.gov/cgi-bin/browse-edgar?CIK=" + symbol + "&amp;output=atom";
	request(url, function(error, response, html)
	{

        if(!error){
			var $ = cheerio.load(html);
			cik = html.match(/<cik>(.*?)<\/cik>/g);
			cik = cik[0].split(">")[1].split("<")[0];
			console.log(cik);
			res.send(cik);
		}
	});
	
}

function get_recent_info(start, count, res)
{
	var url = 'https://www.sec.gov/cgi-bin/current?q1=1&q2=0&q3=4';
	console.log("Parsing URL " + url);
	var promises = [];
	var xml_list = [];
	request(url, function(error, response, html)
	{

        if(!error){
			var $ = cheerio.load(html);
			owner_type = html.match(/<a href=(.*?)>4<\/a>/g);
			console.log(owner_type.length);
			owner_type = owner_type.slice(start-1, start + count - 1);
			console.log(owner_type.length);
			var url_list = [];
			for(var i=0; i<owner_type.length; i++)
			{
				page_link =   owner_type[i].split('"')[1]
				
				url_list.push("https://www.sec.gov" + page_link);
			}
			
		}
		
		console.log(url_list);
		//res.send("Hi");
		fetch_form_4(url_list, function(data)
		{
			res.send(data);
		});
		
	});
}

//get_cik("spke", null);
//get_recent_info(0,0,null);
//get_company_info("0000006769", 0, 1, null);
exports.get_company_info = get_company_info;
exports.get_owner_info = get_owner_info;
exports.get_recent_info = get_recent_info;
exports.get_cik = get_cik;
/*
module.exports = function() { 
    this.get_company_info = get_company_info;
    
    //etc
}

get_company_info("0000902012");
*/