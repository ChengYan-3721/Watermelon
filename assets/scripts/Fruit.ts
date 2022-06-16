import {_decorator, Component, Contact2DType, Collider2D, RigidBody2D, IPhysics2DContact, CCInteger} from 'cc';
import {main, isOver, nodes, collides} from 'db://assets/scripts/main';

const {ccclass, property} = _decorator;

@ccclass('Fruit')
export class Fruit extends Component {
    @property(CCInteger)
    level: number = 0;

    nowTime: number = Date.now();
    isShow: boolean = false;

    start() {
        // 获取任意类型的碰撞器实例，可以使用基类
        const collider = this.node.getComponent(Collider2D);
        // 注册单个碰撞体的回调函数
        collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (selfCollider.tag === otherCollider.tag && selfCollider.tag !== 11) {
            // 碰撞后刚体属性改为false
            otherCollider.enabled = false;
            selfCollider.enabled = false;

            // 获取碰撞位置信息（两个相同的水果碰撞时返回的碰撞位置是一样的）
            const point = contact.getWorldManifold().points;
            let k = 0;
            // 遍历数组，如果数组中x与y的值均存在，则删除水果，删除数据
            for (let i = 0; i < collides.length; i++) {
                if(collides[i] == point[0].x) {
                    k++;
                    collides.splice(i, 1);
                }
                if(collides[i] == point[0].y) {
                    k++;
                    collides.splice(i, 1);
                }
            }
            if(k === 2){
                this.scheduleOnce(()=>{
                    main.instance.score += (this.level + 1) * 5;
                    if(this.isShow) nodes.delete(this.node);
                    this.node.destroy();
                }, 0);
                return;
            }
            // 如果上面没有 return 则说明这个碰撞是新发生的，将位置数据添加到数组中，然后调用合成水果的方法
            collides.push(point[0].x);
            collides.push(point[0].y);

            let points = selfCollider.node.position;
            if(selfCollider.node.position.y > otherCollider.node.position.y) {
                points = otherCollider.node.position;
            }
            this.scheduleOnce(()=>{
                if(this.isShow) nodes.delete(this.node);
                this.node.destroy();
                main.instance.mergeFruits(points, this.level + 1);
                main.instance.score += (this.level + 1) * 5;
            }, 0);
            return;
        }
        if (otherCollider.tag === 14){
            this.scheduleOnce(this.gameOver, 3)
            return;
        }
        if(otherCollider.tag == 99){
            this.nowTime = Date.now();
            this.scheduleOnce(this.showTopLine, 1)
        }
    }

    onEndContact (selfCollider: Collider2D, otherCollider: Collider2D) {
        if (otherCollider.tag === 14){
            this.unschedule(this.gameOver);
            return;
        }
        if(Date.now() - this.nowTime < 888 && otherCollider.tag == 99){
            this.unschedule(this.showTopLine);
        }
        if(otherCollider.tag == 99 && this.isShow ){
            this.isShow = false;
            nodes.delete(this.node);
        }
    }

    update(deltaTime: number) {
        if(isOver){
            this.node.getComponent(RigidBody2D).gravityScale = 0;
            this.node.getComponent(Collider2D).enabled = false;
        }
    }

    // 必须单独拿出来，定时器里不能直接调用其它对象的方法
    gameOver(){
        main.instance.gameOver();
    }

    showTopLine(){
        this.isShow = true;
        nodes.add(this.node);
    }
}

