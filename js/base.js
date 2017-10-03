// 可能前面写的东西没有分号 压缩后就会出问题
;(function(){
    'use strict';
    var $form_add_task = $('.add-task'),
        task_list = {},
        $task_detail = $('.task-detail'),
        $task_detail_mask = $('.task-detail-mask'),
        $task_delete_trigger,
        $task_detail_trigger,
        current_index,
        $update_form,
        $task_detail_content,
        $task_detail_content_input;
    // store.clear();

    init();

    $form_add_task.on('submit', on_add_task_form_submit);
    $task_detail_mask.on('click', hide_task_detail);

    function on_add_task_form_submit(e) {
        var new_task = {}, $input;
        e.preventDefault();
        $input = $(this).find('input[name=content]');
        new_task.content =  $input.val();
        if(!new_task.content) return;
        if(add_task(new_task)){
            //render_task_list();
            $input.val('');
        }
    }

    function rebind_delete() {
        $task_delete_trigger.on('click', function () {
            console.log("clicked delete")
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index')
            console.log(index);
            var tmp = confirm("sure to delete?");
            tmp ? delete_task(index) : null;
        })
    }

    function listen_task_detail() {
        //console.log($task_delete)
        $task_detail_trigger.on('click', function () {
            // dom对象转jquery对象
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = parseInt($item.data('index'));
            console.log("clicked detail index: ", index)
            show_task_detail(index);
        })
    }

    function show_task_detail(index) {
        render_task_detail(index);
        current_index = index;
        $task_detail.show();
        $task_detail_mask.show();
    }

    function update_task(index, data) {
        if(index == undefined || !task_list[index]) return;
        task_list[index] = data;
        refresh();
    }

    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    function add_task(new_task) {
        task_list.push(new_task);
        refresh();
        return true;
    }

    function init() {
        task_list = store.get('task_list') || [];
        // if(task_list.length) render_task_list();
        render_task_list();
    }

    // 更新本地list和网页list
    function refresh() {
        store.set('task_list', task_list);
        render_task_list();
    }
    
    function delete_task(ind) {
        // 这里不转成int是不行的(尽管在网页上的console可以自动转换)
        ind = parseInt(ind)
        if(ind === undefined || !task_list[ind]) return;
        task_list.splice(ind,1);
        refresh();
    }
    
    function render_task_list() {
        /* $task_list为当前list , task_list 为store中的 */
        // 基本类型为值传递 数组对象为地址传递
        var $task_list = $('.task-list')
        // 在重新载入一遍list前，清空本地list
        $task_list.html('');
        //console.log(task_list)
        for(var i = 0; i < task_list.length; i++){
            var $task = render_task_item(task_list[i], i);
            $task_list.append($task)
        }
        $task_delete_trigger = $('.action.delete');
        rebind_delete();
        //console.log("here");
        $task_detail_trigger = $('.action.detail');
        listen_task_detail();
        //console.log($task_detail);
    }

    function render_task_item(data, index){
        var list_item_tpl =
            '<div class="task-item" data-index="'+index+' ">' +
            '            <span><input type="checkbox"></span>' +
            '            <span class="task-content">'+data.content+'</span>' +
            '    <span class="float-right">'+
            '            <span class="action delete">delete</span>' +
            '            <span class="action detail">detail</span>' +
            '     </span>'+
            '</div>'
        return $(list_item_tpl)
    }

    function render_task_detail(index) {
        if(index == undefined || !task_list[index]) return;
        var item = task_list[index];
        console.log(item);
        var tpl = '<form>\n' +
            '            <div class="content">' +
            item.content +
            '            </div>\n' +
            '<div><input style="display: none;" autocomplete="off" type="text" name="content" value="'+item.content+'" </div>'+
            '            <div>\n' +
            '                <div class="desc">\n' +
            '                    <textarea name="desc">' +
            (item.desc || '') +  // 加号优先 或是懒惰取法
            '</textarea>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '            <div class="remind">\n' +
            '                <input name="remind_date" type="date" value="'+item.remind_date+'">\n' +
            '                <div><button type="submit">submit</button></div>\n' +
            '            </div>\n' +
            '        </form>'
        $task_detail.html('');
        $task_detail.html(tpl);
        $update_form = $task_detail.find('form');
        $task_detail_content = $update_form.find('.content');
        $task_detail_content_input = $update_form.find('[name=content]');
        
        $task_detail_content.on('dblclick', function () {
            $task_detail_content_input.show();
            $task_detail_content.hide();
        })

        $update_form.on('submit', function (e) {
            e.preventDefault();
            var data = {};
            data.content = $(this).find('[name = content]').val();
            data.desc = $(this).find('[name = desc]').val();
            data.remind_date = $(this).find('[name = remind_date]').val();
            console.log(data)
            update_task(index, data);
            hide_task_detail();
        })
    }

})();


// 写在外面相当于给window定义的属性