// 可能前面写的东西没有分号 压缩后就会出问题
;(function(){
    'use strict';
    var $form_add_task = $('.add-task'),
        $window = $(window),
        $body = $('body'),
        task_list = {},
        $task_detail = $('.task-detail'),
        $task_detail_mask = $('.mask'),
        $task_delete_trigger,
        $task_detail_trigger,
        current_index,
        $update_form,
        $task_detail_content,
        $task_detail_content_input,
        $checkbox_complete,
        $alerter = $('.alerter');

    init();


    $form_add_task.on('submit', on_add_task_form_submit);
    $task_detail_mask.on('click', hide_task_detail);

    function on_add_task_form_submit(e) {
        var new_task = {}, $input;
        e.preventDefault();
        $input = $(this).find('input[name=content]');
        new_task.content =  $input.val();
        if(!new_task.content) return;
        if(add_task(new_task)) $input.val('');
    }

    function rebind_delete() {
        $task_delete_trigger.on('click', function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = parseInt($item.data('index'));
            console.log("delete" ,index);
            custom_alert({title: 'Warning', content: "sure to delete "+task_list[index].content+'?'})
                .then(function (res) {
                    res ? delete_task(index) : null;
                });
        })
    }

    function listen_task_detail() {
        var index;
        $('.task-item').on('dblclick', function () {
            index = parseInt($(this).data('index'));
            show_task_detail(index);
        });
        $task_detail_trigger.on('click', function () {
            // dom对象转jquery对象
            var $item = $(this).parent().parent();
            index = parseInt($item.data('index'));
            console.log("clicked detail index: ", index);
            show_task_detail(index);
        })
    }
    
    function listen_checkbox_complete() {
        $checkbox_complete.on('click', function () {
            var is_complete = $(this).is(':checked');
            var index = parseInt($(this).parent().parent().data('index'));
            update_task(index, {complete:is_complete});
        })
    }

    function listen_notify_ignored() {
        var $close_notify = $('.close-notify');
        $close_notify.on('click', ignore_notify);
    }

    function show_task_detail(index) {
        render_task_detail(index);
        current_index = index;
        $task_detail.show();
        $task_detail_mask.show();
    }

    function update_task(index, data) {
        if(index === undefined || !task_list[index]) return;
        task_list[index] = $.extend({}, task_list[index], data);
        refresh();
    }

    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    function add_task(new_task) {
        task_list.unshift(new_task);
        refresh();
        return true;
    }

    function listen_task_time() {
        var current_timestamp = (new Date()).getTime();
        console.log(task_list);
        setInterval(function () {
            for(var i = 0;i<task_list.length;i++){
                var item = task_list[i];
                if(!item.timestamp || item.informed) continue;
                console.log(item.timestamp);
                if(current_timestamp - item.timestamp >= 1){
                    console.log(item.informed);
                    update_task(i, {informed: true});
                    notify(i);
                }
            }
        },500)
    }

    function custom_alert(args) {
        // args should include title, content
        var $alert_area = $('<div>' +
            '<div class="alert-title">'+args.title+'</div>' +
            '<div class="alert-content">'+args.content+'</div> ' +
            '<div><button class="alert-confirm">confirm</button><button class="alert-cancel">cancel</button></div>' +
            '' +
            '</div>').css({
            width : 250,
            height: "auto",
            background: '#444',
            position: 'fixed',
            padding: '10px',
            'border-radius': '4px',
            'box-shadow': '0 1px 2px rgba(0, 0, 0, 0.4)'
        });

        var $alert_title = $alert_area.find(".alert-title").css({
            padding: '5px 10px',
            'font-weight' : '900',
            'font-size': '20px',
            'text-align': 'center',
            }),
            $alert_content = $alert_area.find('.alert-content').css({
                'text-align': 'center',
                'padding': '10px'
            }),
            $alert_confirm = $alert_area.find('.alert-confirm'),
            $alert_cancel = $alert_area.find('.alert-cancel'),
            dfd = $.Deferred(),
            confirmed,
            timer;

            timer = setInterval(function () {
                if(confirmed !== undefined){
                    dfd.resolve(confirmed);
                    clearInterval(timer);
                    close_alert();
                }
            }, 50);

            $alert_confirm.on('click', function () {
                confirmed = true;
            });

            $alert_cancel.on('click', function () {
                confirmed = false;
            });
        
        function close_alert() {
            $mask_area.remove();
            $alert_area.remove();
        }

        var $mask_area = $('<div class="custom_alert_mask"><div>').css({
            //display: "block"
        });

        function adjust_box_position() {
            var window_width = $window.width()
                , window_height = $window.height()
                , box_width = $alert_area.width()
                , box_height = $alert_area.height()
                , move_x
                , move_y
            ;

            move_x = (window_width - box_width) / 2;
            move_y = ((window_height - box_height) / 2)*0.8;

            $alert_area.css({
                left: move_x,
                top: move_y
            });
        }

        $window.on('resize', adjust_box_position);

        adjust_box_position();
        $mask_area.appendTo($body);
        $alert_area.appendTo($body);
        return dfd.promise();
    }

    function notify(i) {
        var $notify_area = $('.notify-area'), $notify_title = $('.notify-title'), $notify_content = $('.notify-content');
        $notify_title.html(task_list[i].content);
        $notify_content.html(task_list[i].desc);
        $notify_area.show();
        $alerter.get(0).play();
        listen_notify_ignored();
    }

    function ignore_notify() {
        var $notify_area = $('.notify-area');
        $notify_area.hide();
    }

    function init() {
        task_list = store.get('task_list') || [];
        // if(task_list.length) render_task_list();
        render_task_list();
        listen_task_time();
    }

    // 更新本地list和网页list
    function refresh() {
        console.log("refresh...");
        store.set('task_list', task_list);
        render_task_list();
    }
    
    function delete_task(ind) {
        // 这里不转成int是不行的(尽管在网页上的console可以自动转换)
        if(ind === undefined || !task_list[ind]) return;
        task_list.splice(ind,1);
        refresh();
    }
    
    function render_task_list() {
        /* $task_list为当前list , task_list 为store中的 */
        // 基本类型为值传递 数组对象为地址传递
        var $task_list = $('.task-list');
        // 在重新载入一遍list前，清空本地list
        $task_list.html('');
        //console.log(task_list)
        var completed_items = [];
        for(var i = 0; i < task_list.length; i++){
            var $task = render_task_item(task_list[i], i);
            if(task_list[i].complete){
                completed_items.push($task);
                $task.find('.complete').attr('checked', true);
            }
            else $task_list.append($task);
        }
        for(i = 0; i < completed_items.length; i++) $task_list.append(completed_items[i]);
        $task_delete_trigger = $('.action.delete');
        rebind_delete();
        //console.log("here");
        $task_detail_trigger = $('.action.detail');
        listen_task_detail();
        $checkbox_complete = $('.task-list .complete');
        //console.log("all items with checkbox", $checkbox_complete);
        listen_checkbox_complete();
    }

    function render_task_item(data, index){
        var list_item_tpl;
        if(data.complete){
            list_item_tpl =
                '<div class="task-item task-completed" data-index="'+index+' ">' +
                '            <span><input class="complete" checked type="checkbox"></span>' +
                '            <span class="task-content"><del>'+data.content+'</del></span>' +
                '    <span class="float-right">'+
                '            <span class="action delete">delete</span>' +
                '            <span class="action detail">detail</span>' +
                '     </span>'+
                '</div>'
        }
        else{
            list_item_tpl =
                '<div class="task-item" data-index="'+index+' ">' +
                '            <span><input class="complete"  type="checkbox"></span>' +
                '            <span class="task-content">'+data.content+'</span>' +
                '    <span class="float-right">'+
                '            <span class="action delete">delete</span>' +
                '            <span class="action detail">detail</span>' +
                '     </span>'+
                '</div>'
        }

        return $(list_item_tpl)
    }

    function render_task_detail(index) {
        //console.log("index detail at ",task_list[ind]);
        if(index === undefined || !task_list[index]) return;
        var item = task_list[index];
        console.log(item);
        var tpl = '<form>\n' +
            '            <div class="content input-item">' +
            item.content +
            '            </div>\n' +
            '<div><input class="input-item" style="display: none;" autocomplete="off" type="text" name="content" value="'+item.content+'" </div>'+
            '            <div>\n' +
            '                <div class="desc input-item">\n' +
            '                    <textarea name="desc">' +
            (item.desc || '') +  // 加号优先 或是懒惰取法
            '</textarea>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '            <div class="remind">\n' +
            '<div class="item-detail-label">提醒时间</div>'+
            '               <div> <input class="input-item datetime" name="remind_date" type="date" value="'+item.remind_date+'"">\n' +
            ' <input class="datetime_hour" value="'+(item.remind_hour || "")+'">时<input class="datetime_min" value="'+(item.remind_min || "")+'">分</div>'+
            '                <div class="input-item"><button type="submit">submit</button></div>\n' +
            '            </div>\n' +
            '        </form>';
        $task_detail.html('');
        $task_detail.html(tpl);
        $update_form = $task_detail.find('form');
        $task_detail_content = $update_form.find('.content');
        $task_detail_content_input = $update_form.find('[name=content]');
        
        $task_detail_content.on('dblclick', function () {
            $task_detail_content_input.show();
            $task_detail_content.hide();
        });

        $update_form.on('submit', function (e) {
            e.preventDefault();
            var data = {};
            data.content = $(this).find('[name = content]').val();
            data.desc = $(this).find('[name = desc]').val();
            data.remind_date = $(this).find('[name = remind_date]').val();
            data.remind_hour = $(this).find('.datetime_hour').val();
            data.remind_min = $(this).find('.datetime_min').val();
            if(data.remind_date && data.remind_hour && data.remind_min){
                data.time = data.remind_date+" "+data.remind_hour+":"+data.remind_min;
                data.timestamp = (new Date(data.time)).getTime();
            }
            else data.time = "";
            update_task(index, data);
            hide_task_detail();
        })
    }

})();


// 写在外面相当于给window定义的属性