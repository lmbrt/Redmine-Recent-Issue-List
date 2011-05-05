/* Copyright 2011 Dustin Lambert - Licensed under: GNU Public License 2.1 or later */

var issueMatcher = new RegExp(/.*\/issues\/(\d+).*/gi);
var currentIssue = null;
var maxIssues = 10;

function trackRecentHistory()
{
	
	var results = issueMatcher.exec(location.href);
	if (results == undefined || results == null || results.length < 2 || results[1].length < 1)
	{
		return;
	}
	currentIssue = results[1];
	var issueTitle = null;
	var issueSubject = null;
	
	$$("#content h2").each(function(e)
	{
		issueTitle = e.innerHTML;	
	});

	$$("#content div.subject h3").each(function(e)
	{
		issueSubject = e.innerHTML;
	});
		
	if (issueTitle === null || issueSubject === null)
	{
		return;
	}

	var recentIssues = new JsonCookies();
	issueArray = recentIssues.get("recentIssues");
	if (! issueArray)
	{
		issueArray = [];
	}

	var issueHash = {};
	
	issueHash[currentIssue]=1;
	var newArray = [];
	var cidx = 1;	
	for (var i = 0; i < issueArray.length; i++)
	{
		if (i <= maxIssues)
		{
			var entry = issueArray[i];
			if (issueHash[entry.ID] != 1)
			{
				issueHash[entry.ID] = 1;
				newArray[cidx]=entry;
				cidx++;
			}
		}
	}
	
	issueArray = newArray;
	
		
	var thisEntry = {
		ID: currentIssue,
		Str: issueTitle + ": " + issueSubject
	};
	
	issueArray[0] = thisEntry;
	recentIssues.set("recentIssues", issueArray, 45);
	

}

function showRecentHistory()
{
	if($("sidebar"))
	{
		var recentIssues = new JsonCookies();
	        issueArray = recentIssues.get("recentIssues");


		var recentList = new Element("h3");
		recentList.update("Recently Viewed Issues");

	        
		$("sidebar").insert({top:recentList});
		var issuesShown = 0;
		for (var i = issueArray.length - 1; i >= 0; i--)
		{
			var entry = issueArray[i];

			if (entry.ID != currentIssue)
			{
				issuesShown++;
				var entryitem = new Element("a");
				entryitem.setAttribute("href", "/redmine/issues/" + entry.ID);
				var disp = entry.Str;
				if (disp.length > 55)
				{
					disp = disp.substring(0, 55) + "..."
				}
				entryitem.update(disp + "<br>" );
				recentList.insert({after:entryitem});
			}
		}
		
		if (issuesShown < 1)
		{
			recentList.hide();
		}
	}

}

document.observe('dom:loaded', function(){
	trackRecentHistory();
	showRecentHistory();
});

var Cookies = Class.create({
    initialize: function(path, domain) {
        this.path = path || '/';
        this.domain = domain || null;
    },
    // Sets a cookie
    set: function(key, value, days) {
        if (typeof key != 'string') {
            throw "Invalid key";
        }
        if (typeof value != 'string' && typeof value != 'number') {
            throw "Invalid value";
        }
        if (days && typeof days != 'number') {
            throw "Invalid expiration time";
        }
        var setValue = key+'='+escape(new String(value));
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var setExpiration = "; expires="+date.toGMTString();
        } else var setExpiration = "";
        var setPath = '; path='+escape(this.path);
        var setDomain = (this.domain) ? '; domain='+escape(this.domain) : '';
        var cookieString = setValue+setExpiration+setPath+setDomain;
        document.cookie = cookieString;
    },
    // Returns a cookie value or false
    get: function(key) {
        var keyEquals = key+"=";
        var value = false;
        document.cookie.split(';').invoke('strip').each(function(s){
            if (s.startsWith(keyEquals)) {
                value = unescape(s.substring(keyEquals.length, s.length));
                throw $break;
            }
        });
        return value;
    },
    // Clears a cookie
    clear: function(key) {
        this.set(key,'',-1);
    },
    // Clears all cookies
    clearAll: function() {
        document.cookie.split(';').collect(function(s){
            return s.split('=').first().strip();
        }).each(function(key){
            this.clear(key);
        }.bind(this));
    }
});

var JsonCookies = Class.create(Cookies, {});
JsonCookies.addMethods({
    // Overridden set method to JSON-encode value
    set: function($super, key, value, days) {
        switch (typeof value) {
            case 'undefined':
            case 'function':
            case 'unknown':
                throw "Invalid value type";
                break;
            case 'boolean':
            case 'string':
            case 'number':
                value = String(value.toString());
            break;
        }
        $super(key, Object.toJSON(value), days);
    },
    // Overriden get method to JSON-decode the value
    get: function($super, key) {
        var value = $super(key);
        return (value) ? value.evalJSON() : false;
    }
});
