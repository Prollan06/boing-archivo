let database=[]

async function load(){
    let source=document.getElementById("source").value
    let r=await fetch("data/"+source+".json")
    database=await r.json()
    stats()
}

load()

document.getElementById("source").addEventListener("change",load)
document.getElementById("search").addEventListener("input",search)

// Analiza la consulta con operadores nuevos: series, episode, fechas, OR, -
function parseQuery(q){
    return {
        series:(q.match(/series:("[^"]+"|\S+)/i)||[])[1]?.replace(/"/g,"")?.toLowerCase(),
        episode:(q.match(/episode:("[^"]+"|\S+)/i)||[])[1]?.replace(/"/g,"")?.toLowerCase(),
        phrase:(q.match(/"(.*?)"/)||[])[1]?.toLowerCase(),
        after:(q.match(/after:(\d{4}-\d{2}-\d{2})/)||[])[1],
        before:(q.match(/before:(\d{4}-\d{2}-\d{2})/)||[])[1],
        exclude:(q.match(/-(\S+)/g)||[]).map(x=>x.replace("-","").toLowerCase()),
        OR:(q.match(/(\S+)\s+OR\s+(\S+)/i)||[]).slice(1).map(x=>x.toLowerCase())
    }
}

function search(){
    let q=document.getElementById("search").value
    let p=parseQuery(q)

    let results=database.filter(x=>{
        let s=x.series.toLowerCase()
        let e=x.episode?.toLowerCase()||""

        // series filter
        if(p.series && !s.includes(p.series)) return false
        // episode filter
        if(p.episode && !e.includes(p.episode)) return false
        // phrase anywhere
        if(p.phrase && !(s.includes(p.phrase)||e.includes(p.phrase))) return false
        // exclude
        if(p.exclude.some(ex=>s.includes(ex)||e.includes(ex))) return false
        // OR
        if(p.OR.length>0 && !p.OR.some(or=>s.includes(or)||e.includes(or))) return false
        // after/before date
        if(p.after && x.date<=p.after) return false
        if(p.before && x.date>=p.before) return false

        return true
    })

    render(results)
}

function render(res){
    let div=document.getElementById("results")
    div.innerHTML=""
    res.slice(0,200).forEach(r=>{
        let el=document.createElement("div")
        el.className="result"
        el.innerHTML=`
            <b>${r.series}</b> ${r.episode?"— "+r.episode:""}<br>
            ${r.date} — ${r.start} / ${r.end}
        `
        div.appendChild(el)
    })
}

function stats(){
    let total=database.length
    let shows={}
    database.forEach(x=>{
        shows[x.series]=(shows[x.series]||0)+1
    })
    let top=Object.entries(shows).sort((a,b)=>b[1]-a[1])[0]
    document.getElementById("stats").innerHTML=`
        Programas indexados: ${total}<br>
        Serie más emitida: ${top[0]} (${top[1]})
    `
}