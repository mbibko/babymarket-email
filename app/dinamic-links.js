;
(function() {
    var request = new XMLHttpRequest();
    request.open('GET', 'ajax.pages_list.php', true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        // Success!
        var resp = this.response;
        console.log(resp);

        if (resp.toString().indexOf('<?php') == 0) return;
        var wnd = document.createElement("div");
        wnd.style = 'color: #fff; position: absolute; top: 10px; left: 10px; background: #000; border: 2px solid #ccc; z-index: 101000; padding: 10px';
        
        var close = document.createElement("div");
        close.style = 'color: #fff; font-weight: normal; display: block; margin-bottom: 10px; text-decoration: underline; cursor: pointer;';
        close.innerHTML = 'Список страниц :: Закрыть';
        close.addEventListener('click', function() {
            wnd.style.display = 'none';
        });
        wnd.appendChild(close);
        
        var even = false;
        JSON.parse(resp).pages.forEach(function(item, i, arr) {
            var style = even ? 'color: #000; background: #f5f4f4; ' : 'background: #fff; color: #000;';
            var link = document.createElement("a");
            link.style = style + ' padding: 8px 10px; font-weight: normal; display: block;';
            link.href = item;
            link.innerHTML = item;
            wnd.appendChild(link);
            even = !even;
        });
        
        document.body.append(wnd);
      } else {
        // We reached our target server, but it returned an error

      }
    };

    request.onerror = function() {
      // There was a connection error of some sort
    };

    request.send();
}());
