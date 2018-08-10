var http = require('http');
var fs = require("fs")
var formidable = require('formidable');

http.createServer(function (req, res) {
  if (req.url == '/fileupload') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.filetoupload.path
      
      fs.readFile(oldpath, 'utf8', function (err,data) {
            if(err)
            {
                res.write(err);
                return res.end()
            }
            else
            {    
                try{
                    user_data = JSON.parse(data);
                    sum = 0;
                    for(var i =0; i<user_data.length; i++)
                    {
                        sum += user_data[i]["num"];
                
                    }
                    res.write("Sum=> " + sum);
                    return res.end()
                }catch(e)
                {
                    res.write("Invalid json");
                    return res.end();
                }
            }
        });
    });
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();
  }
}).listen(8001);