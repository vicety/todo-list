// 可能前面写的东西没有分号 压缩后就会出问题
;(function(){
    'use strict';
    var form_add_task = $('.add-task'),
        task_list = {},
        $delete_task;
    // store.clear();

    init();
    form_add_task.on('submit', function (e) {
        var new_task = {}, $input;
        e.preventDefault();
        $input = $(this).find('input[name=content]');
        new_task.content =  $input.val();
        if(!new_task.content) return;
        if(add_task(new_task)){
            //render_task_list();
            $input.val('');
        }
    })

    function rebind_delete() {
        $delete_task.on('click', function () {
            console.log("clicked delete")
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index')
            console.log(index);
            var tmp = confirm("sure to delete?");
            tmp ? delete_task(index) : null;
        })
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
        var $task_list = $('.task-list')
        // 在重新载入一遍list前，清空本地list
        $task_list.html('');
        console.log(task_list)
        for(var i = 0; i < task_list.length; i++){
            var $task = render_task_item(task_list[i], i);
            $task_list.append($task)
        }
        $delete_task = $('.action.delete');
        rebind_delete();
    }

    function render_task_item(data, index){
        var list_item_tpl =
            '<div class="task-item" data-index="'+index+' ">' +
            '            <span><input type="checkbox"></span>' +
            '            <span class="task-content">'+data.content+'</span>' +
            '    <span class="float-right">'+
            '            <span class="action delete">delete</span>' +
            '            <span class="action">detail</span>' +
            '     </span>'+
            '</div>'
        return $(list_item_tpl)
    }
})();


// 写在外面相当于给window定义的属性