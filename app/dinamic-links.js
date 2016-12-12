;
(function() {
    $.ajax({
            'url': 'ajax.pages_list.php',
            'type': 'get'
        })
        .fail(function() {})
        .success(function(data) {
            if (data.toString().indexOf('<?php') == 0) return;
            var $wnd = $('<div style="color: #fff; position: absolute; top: 10px; left: 10px; background: #000; border: 2px solid #ccc; z-index: 101000; padding: 10px; "/>');
            var $close = $('<a href="#" style="color: #fff; font-weight: normal; display: block; margin-bottom: 10px;">Список страниц :: Закрыть</a>')
                .click(function(e) {
                    e.preventDefault();
                    $wnd.hide();
                })
                .appendTo($wnd);
            var even = false;
            $(data.pages).each(function() {
                var page = this;
                var style = even ? 'color: #000; background: #f5f4f4; ' : 'background: #fff; color: #000;'
                $wnd.append('<a href="' + page + '" style="' + style + ' padding: 8px 10px; font-weight: normal; display: block;">' + page + '</a>');
                even = !even;
            });
            $('body').append($wnd);
        });
}());
